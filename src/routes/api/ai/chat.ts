import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  getClientIp,
  getUserAgent,
  jsonResponse,
  recordAudit,
  checkRateLimits,
} from "@/lib/security.server";
import { RATE_LIMIT_CONFIG, rateLimitExceededResponse } from "@/lib/rateLimitConfig.server";

/**
 * Server-side proxy for the Gemini call.
 *
 * WHY THIS EXISTS
 *
 * geminiService.ts used to call generativelanguage.googleapis.com straight from
 * the browser, reading its key from `VITE_GEMINI_API_KEY`. Any variable with the
 * VITE_ prefix is inlined into the client bundle by Vite at build time, which is
 * not a misconfiguration — it is what the prefix means. The consequence is that
 * the key shipped to every visitor: it was recoverable verbatim from
 * .output/public/assets/index-*.js in a normal production build, so anyone who
 * loaded the site could take it and spend the project's Gemini quota.
 *
 * The key is now read only here, from `GEMINI_API_KEY` with no VITE_ prefix, so
 * it exists only in the server bundle. The browser sends a prompt and receives
 * text; it never sees a credential.
 */

// Verified against the provider's ListModels API — both are GA and support
// :streamGenerateContent. gemini-2.5-flash is a faster, higher-quality successor
// to 1.5-flash; gemini-flash-latest tracks the latest stable Flash as a fallback.
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-flash-latest"] as const;

/**
 * Concise, production generation config. `maxOutputTokens` caps worst-case
 * latency (concierge answers are short); a low temperature keeps the tone stable
 * and grounded; `thinkingConfig.thinkingBudget: 0` turns off 2.5-flash "thinking"
 * so the first token streams immediately. The prompt is unchanged — this only
 * bounds the generation, it never enlarges the request.
 */
const GENERATION_CONFIG = {
  temperature: 0.4,
  maxOutputTokens: 512,
  thinkingConfig: { thinkingBudget: 0 },
} as const;

/** Abort a Gemini request that hasn't completed within this budget (ms). */
const GEMINI_TIMEOUT_MS = 15000;

/** Shape accepted from the client — prompt content only, never a key. */
interface ChatRequest {
  contents?: Array<{ role: string; parts: Array<{ text: string }> }>;
}

async function countRecentAiRequests(
  field: "ip_address" | "actor_id",
  value: string,
  sinceIso: string,
): Promise<number> {
  const { count } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("event", "ai.chat")
    .eq(field, value)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);

        // Optional authenticated user identification
        const authHeader = request.headers.get("Authorization");
        let userId: string | null = null;
        if (authHeader) {
          const match = authHeader.match(/^Bearer\s+([A-Za-z0-9-_=.]+)\s*$/);
          if (match) {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const token = match[1];
              const { data } = await supabaseAdmin.auth.getUser(token);
              if (data?.user) userId = data.user.id;
            } catch {
              // Ignore malformed token
            }
          }
        }

        // Multi-layer rate limit: IP hourly limit + User quota
        const rulesToCheck = [
          {
            rule: RATE_LIMIT_CONFIG.AI_IP_HOURLY,
            count: (since: string) => countRecentAiRequests("ip_address", ip, since),
          },
        ];

        if (userId) {
          rulesToCheck.push({
            rule: RATE_LIMIT_CONFIG.AI_USER_HOURLY,
            count: (since: string) => countRecentAiRequests("actor_id", userId!, since),
          });
        }

        const limit = await checkRateLimits(rulesToCheck);
        if (!limit.allowed) {
          await recordAudit({
            event: "ai.rejected",
            outcome: "rate_limited",
            ip,
            userAgent,
            actorId: userId,
            details: { rule: limit.rule?.name },
          });
          return rateLimitExceededResponse(
            limit.rule?.name ?? "ai:rate_limit",
            limit.retryAfterSeconds,
          );
        }

        // Request body size limit
        const raw = await request.text();
        if (raw.length > RATE_LIMIT_CONFIG.AI_MAX_PAYLOAD_BYTES) {
          await recordAudit({
            event: "ai.rejected",
            outcome: "rejected",
            ip,
            userAgent,
            actorId: userId,
            details: { reason: "payload_too_large", bytes: raw.length },
          });
          return jsonResponse({ error: "Request body exceeds allowed size limit (16KB)." }, 413);
        }

        let body: ChatRequest = {};
        try {
          body = JSON.parse(raw) as ChatRequest;
        } catch {
          return jsonResponse({ error: "Invalid JSON request body." }, 400);
        }

        const contents = body.contents;
        if (!Array.isArray(contents) || contents.length === 0) {
          return jsonResponse({ error: "No prompt supplied." }, 400);
        }

        // Validate prompt length
        const totalPromptLength = contents.reduce((acc, c) => {
          return acc + (c.parts || []).reduce((pAcc, p) => pAcc + (p.text?.length || 0), 0);
        }, 0);

        if (totalPromptLength > RATE_LIMIT_CONFIG.AI_MAX_PROMPT_CHARS) {
          return jsonResponse({ error: "Prompt exceeds maximum allowed character length." }, 400);
        }

        const apiKey = process.env.GEMINI_API_KEY ?? "";
        if (!apiKey.trim()) {
          // Honest unconfigured state rather than a fabricated answer. The
          // caller falls back to its local response engine.
          return jsonResponse({ unconfigured: true }, 200);
        }

        const encoder = new TextEncoder();

        // Try each model in turn, but only until a stream successfully OPENS.
        // Once bytes are flowing we commit to that model (we can't fall back
        // mid-stream), so the fallback covers connection/availability failures.
        for (const model of GEMINI_MODELS) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

          let upstream: Response;
          try {
            upstream = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents, generationConfig: GENERATION_CONFIG }),
                signal: controller.signal,
              },
            );
          } catch {
            // Network error or the 15s abort fired before headers — try next model.
            clearTimeout(timeout);
            continue;
          }

          if (!upstream.ok || !upstream.body) {
            clearTimeout(timeout);
            continue;
          }

          // Commit to this model. Transform Gemini's SSE deltas into a plain-text
          // stream for the browser. The key stays server-side; the client only
          // ever receives generated text.
          const upstreamBody = upstream.body;
          const stream = new ReadableStream<Uint8Array>({
            async start(streamCtrl) {
              const reader = upstreamBody.getReader();
              const decoder = new TextDecoder();
              let buffer = "";
              let sawText = false;
              let failed = false;

              try {
                for (;;) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });

                  let nl: number;
                  while ((nl = buffer.indexOf("\n")) >= 0) {
                    const line = buffer.slice(0, nl).trim();
                    buffer = buffer.slice(nl + 1);
                    if (!line.startsWith("data:")) continue;
                    const payload = line.slice(5).trim();
                    if (!payload || payload === "[DONE]") continue;
                    try {
                      const obj = JSON.parse(payload) as {
                        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
                      };
                      const delta = obj.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (delta) {
                        sawText = true;
                        streamCtrl.enqueue(encoder.encode(delta));
                      }
                    } catch {
                      // Partial/malformed SSE line — ignore and wait for more bytes.
                    }
                  }
                }
              } catch {
                // Upstream aborted (timeout) or a transport error mid-stream.
                failed = true;
              } finally {
                clearTimeout(timeout);
              }

              // Audit AFTER the text is delivered but BEFORE closing: reliable
              // (no dangling promise that a serverless runtime could drop) while
              // staying off the user's response path — the answer already streamed.
              await recordAudit({
                event: "ai.chat",
                outcome: !failed && sawText ? "success" : "error",
                ip,
                userAgent,
              });

              if (failed) {
                // Signal the client so an incomplete answer falls back locally,
                // rather than presenting a truncated stream as a finished reply.
                streamCtrl.error(new Error("gemini_stream_incomplete"));
              } else {
                streamCtrl.close();
              }
            },
            cancel() {
              clearTimeout(timeout);
              controller.abort();
            },
          });

          return new Response(stream, {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "X-Accel-Buffering": "no",
            },
          });
        }

        // Every model failed to open a stream within the timeout.
        await recordAudit({ event: "ai.chat", outcome: "error", ip, userAgent });
        // Never forward the upstream error body — it can echo the request URL,
        // which carries the key as a query parameter.
        return jsonResponse({ error: "The assistant is unavailable right now." }, 502);
      },
    },
  },
});
