import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  getClientIp,
  getUserAgent,
  jsonResponse,
  recordAudit,
  checkRateLimits,
  type RateLimitRule,
} from "@/lib/security.server";

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

const PER_IP_AI: RateLimitRule = {
  name: "ai:ip:hourly",
  windowSeconds: 3600,
  max: 40,
};

const GEMINI_MODELS = ["gemini-1.5-flash", "gemini-flash-latest"] as const;

/** Shape accepted from the client — prompt content only, never a key. */
interface ChatRequest {
  contents?: Array<{ role: string; parts: Array<{ text: string }> }>;
}

async function countRecentAiRequests(ip: string, sinceIso: string): Promise<number> {
  const { count } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("event", "ai.chat")
    .eq("ip_address", ip)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);

        // The proxy spends real money per call, so it is rate limited per IP for
        // the same reason the contact endpoint is.
        const limit = await checkRateLimits([
          { rule: PER_IP_AI, count: (since) => countRecentAiRequests(ip, since) },
        ]);
        if (!limit.allowed) {
          await recordAudit({ event: "ai.rejected", outcome: "rate_limited", ip, userAgent });
          return jsonResponse({ error: "Too many requests. Please try again later." }, 429);
        }

        let body: ChatRequest = {};
        try {
          body = (await request.json()) as ChatRequest;
        } catch {
          return jsonResponse({ error: "Invalid request body." }, 400);
        }

        const contents = body.contents;
        if (!Array.isArray(contents) || contents.length === 0) {
          return jsonResponse({ error: "No prompt supplied." }, 400);
        }

        const apiKey = process.env.GEMINI_API_KEY ?? "";
        if (!apiKey.trim()) {
          // Honest unconfigured state rather than a fabricated answer. The
          // caller falls back to its local response engine.
          return jsonResponse({ unconfigured: true }, 200);
        }

        for (const model of GEMINI_MODELS) {
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents }),
              },
            );
            if (!res.ok) continue;
            const data = (await res.json()) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            };
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) continue;

            await recordAudit({ event: "ai.chat", outcome: "success", ip, userAgent });
            return jsonResponse({ text });
          } catch {
            // Try the next model rather than failing on the first transport error.
          }
        }

        await recordAudit({ event: "ai.chat", outcome: "error", ip, userAgent });
        // Never forward the upstream error body — it can echo the request URL,
        // which carries the key as a query parameter.
        return jsonResponse({ error: "The assistant is unavailable right now." }, 502);
      },
    },
  },
});
