export function renderErrorPage(error?: unknown): string {
  const isDev = process.env.NODE_ENV !== "production";
  const thrown = error as { message?: unknown; stack?: unknown } | undefined;
  const errorMessage =
    (typeof thrown?.message === "string" && thrown.message) ||
    (error != null ? String(error) : "") ||
    "Unknown server exception";
  const stackTrace = typeof thrown?.stack === "string" ? thrown.stack : "";
  const requestId = `ERR-${Date.now().toString(36).toUpperCase()}-UP`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Seedha Properties — System Interruption</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { --bg: #090d16; --card: #111827; --text: #f9fafb; --muted: #9ca3af; --primary: #10b981; --rose: #f43f5e; }
      body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 36rem; width: 100%; text-align: center; background: var(--card); border: 1px solid #1f2937; border-radius: 1.5rem; padding: 2rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
      .badge { display: inline-flex; align-items: center; gap: 0.375rem; background: rgba(16, 185, 129, 0.1); color: var(--primary); font-size: 0.75rem; font-weight: 800; padding: 0.375rem 0.875rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
      h1 { font-size: 1.5rem; font-weight: 800; margin: 1rem 0 0.5rem; }
      p { color: var(--muted); font-size: 0.875rem; margin: 0 0 1.25rem; line-height: 1.5; }
      .code-box { background: #030712; border: 1px solid #374151; border-radius: 0.75rem; padding: 1rem; text-align: left; font-family: monospace; font-size: 0.75rem; color: #f87171; overflow-x: auto; margin-bottom: 1.5rem; white-space: pre-wrap; word-break: break-word; }
      .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      button, a { padding: 0.625rem 1.25rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 700; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: all 0.2s; }
      .btn-primary { background: var(--primary); color: #ffffff; }
      .btn-secondary { background: #1f2937; color: var(--text); border-color: #374151; }
      .copyright { margin: 1.5rem 0 0; font-size: 0.75rem; color: var(--muted); }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">Seedha Properties</div>
      <h1>System Interruption</h1>
      <p>We are experiencing a temporary system interruption. Our engineering team has logged this event. Reference Code: <strong>${requestId}</strong></p>

      ${
        isDev && (errorMessage || stackTrace)
          ? `<div class="code-box"><strong>[DEV DIAGNOSTICS]</strong>\nError: ${errorMessage}\n\nStack Trace:\n${stackTrace}</div>`
          : ""
      }

      <div class="actions">
        <button class="btn-primary" onclick="location.reload()">Try Again</button>
        <a class="btn-secondary" href="/">Return to Home</a>
      </div>

      <p class="copyright">© 2026 Seedha Properties. All Rights Reserved.</p>
    </div>
  </body>
</html>`;
}
