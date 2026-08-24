import { createFileRoute } from "@tanstack/react-router";
import { getEmailPreviews, type EmailTemplateKey } from "@/shared/services/email/templates";

/**
 * Local email template preview. Renders a template's HTML with SAMPLE data (no
 * real recipients, no real OTP, no sending). Disabled in production.
 *
 *   /api/dev/email-preview/otp
 *   /api/dev/email-preview/welcome
 *   /api/dev/email-preview/list   -> index of all templates
 */
export const Route = createFileRoute("/api/dev/email-preview/$type")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (process.env.NODE_ENV === "production") {
          return new Response("Not found", { status: 404 });
        }
        const previews = getEmailPreviews();
        const preview = previews[params.type as EmailTemplateKey];
        if (!preview) {
          const list = Object.keys(previews)
            .map((k) => `<li><a href="/api/dev/email-preview/${k}">${k}</a></li>`)
            .join("");
          return new Response(
            `<!doctype html><meta charset="utf-8"><title>Seedha email previews</title>` +
              `<h1>Seedha email previews</h1><ul>${list}</ul>`,
            { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
          );
        }
        return new Response(preview.htmlBody, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
