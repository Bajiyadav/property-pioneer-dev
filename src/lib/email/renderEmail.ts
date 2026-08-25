/**
 * Seedha Properties — centralized transactional email layout.
 *
 * ONE branded shell for every transactional email: a clean white header with the
 * Seedha Properties wordmark, a structured body (title, greeting, short copy,
 * prominent info, one primary CTA), and a professional footer. Email-safe only —
 * table layout + inline CSS so it renders in Gmail, Outlook and Apple Mail; no
 * modern CSS, no external assets. Produces BOTH an HTML body and a plain-text
 * fallback from the same structured content, so the two never drift.
 *
 * All identity/links come from the app config — nothing is invented here (no
 * phone numbers, no addresses, no claims).
 */

import { APP_NAME, APP_URL } from "@/config/app";

/** Sender identity + support contact, reused everywhere. Not secrets. */
export const EMAIL_SENDER = `Seedha Properties <notifications@seedhaproperties.com>`;
export const EMAIL_SUPPORT_EMAIL = "support@seedhaproperties.com";
const PRIVACY_URL = `${APP_URL}/privacy-policy`;
const TERMS_URL = `${APP_URL}/terms-of-service`;

const C = {
  brand: "#059669", // emerald-600 — Seedha brand accent
  brandDark: "#047857",
  ink: "#0f172a",
  text: "#334155",
  muted: "#64748b",
  border: "#e2e8f0",
  pageBg: "#f1f5f9",
  card: "#ffffff",
  danger: "#be123c",
  dangerBg: "#fff1f2",
  dangerBorder: "#fecdd3",
  highlightBg: "#ecfdf5",
  highlightBorder: "#a7f3d0",
};
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface EmailButton {
  label: string;
  url: string;
}
export interface EmailInfoRow {
  label: string;
  value: string;
}
export interface EmailHighlight {
  label: string;
  value: string;
}

export interface EmailContent {
  subject: string;
  /** Hidden inbox preview line. */
  preheader?: string;
  title: string;
  /** `null`/undefined → "Hello there," (never asks for a name). */
  greetingName?: string | null;
  intro?: string[];
  infoRows?: EmailInfoRow[];
  /** A single very prominent value, e.g. an OTP. */
  highlight?: EmailHighlight;
  cta?: EmailButton;
  outro?: string[];
  securityNotes?: string[];
  tone?: "default" | "security";
}

export interface RenderedEmail {
  subject: string;
  htmlBody: string;
  textBody: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function greeting(name?: string | null): string {
  const n = (name ?? "").trim();
  return n ? `Hello ${n},` : "Hello there,";
}

function accent(tone: EmailContent["tone"]): string {
  return tone === "security" ? C.danger : C.brand;
}

/** Renders the branded HTML + plain-text bodies from one structured content object. */
export function renderEmail(content: EmailContent): RenderedEmail {
  const bar = accent(content.tone);
  const year = new Date().getFullYear();

  const introHtml = (content.intro ?? [])
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:${C.text};">${esc(p)}</p>`,
    )
    .join("");

  const highlightHtml = content.highlight
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px 0;">
        <tr><td align="center" style="background-color:${C.highlightBg};border:1px solid ${C.highlightBorder};border-radius:10px;padding:20px;">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${C.muted};margin-bottom:8px;">${esc(content.highlight.label)}</div>
          <div style="font-size:32px;font-weight:700;letter-spacing:.24em;color:${C.ink};font-family:${FONT};">${esc(content.highlight.value)}</div>
        </td></tr>
      </table>`
    : "";

  const infoHtml =
    content.infoRows && content.infoRows.length > 0
      ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px 0;background-color:#f8fafc;border:1px solid ${C.border};border-radius:10px;">
        <tr><td style="padding:6px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            ${content.infoRows
              .map(
                (row) =>
                  `<tr>
                     <td style="color:${C.muted};padding:8px 0;vertical-align:top;width:42%;"><strong>${esc(row.label)}</strong></td>
                     <td style="color:${C.ink};padding:8px 0;vertical-align:top;">${esc(row.value)}</td>
                   </tr>`,
              )
              .join("")}
          </table>
        </td></tr>
      </table>`
      : "";

  const ctaHtml = content.cta
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 24px 0;">
        <tr><td align="center" bgcolor="${bar}" style="border-radius:8px;">
          <a href="${esc(content.cta.url)}" target="_blank"
             style="display:inline-block;padding:13px 30px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;background-color:${bar};">
            ${esc(content.cta.label)}
          </a>
        </td></tr>
      </table>`
    : "";

  const outroHtml = (content.outro ?? [])
    .map(
      (p) =>
        `<p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:${C.muted};">${esc(p)}</p>`,
    )
    .join("");

  const securityHtml =
    content.securityNotes && content.securityNotes.length > 0
      ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr><td style="background-color:${C.dangerBg};border:1px solid ${C.dangerBorder};border-radius:8px;padding:14px 16px;">
          ${content.securityNotes
            .map(
              (n, i) =>
                `<p style="margin:${i === 0 ? "0" : "6px 0 0 0"};font-size:12px;line-height:1.5;color:${C.danger};">${esc(n)}</p>`,
            )
            .join("")}
        </td></tr>
      </table>`
      : "";

  const htmlBody = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${esc(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.pageBg};">
<span style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${esc(content.preheader ?? content.title)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.pageBg};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
      <!-- Header -->
      <tr><td style="background-color:${C.card};border:1px solid ${C.border};border-bottom:none;border-radius:12px 12px 0 0;padding:22px 28px;">
        <span style="font-family:${FONT};font-size:20px;font-weight:800;color:${C.brand};letter-spacing:-.01em;">SEEDHA</span>
        <span style="font-family:${FONT};font-size:20px;font-weight:600;color:${C.ink};letter-spacing:-.01em;"> Properties</span>
      </td></tr>
      <!-- Accent bar -->
      <tr><td style="height:4px;background-color:${bar};line-height:4px;font-size:0;">&nbsp;</td></tr>
      <!-- Body -->
      <tr><td style="background-color:${C.card};border:1px solid ${C.border};border-top:none;padding:28px;">
        <h1 style="margin:0 0 16px 0;font-family:${FONT};font-size:21px;font-weight:700;color:${C.ink};">${esc(content.title)}</h1>
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${C.text};">${esc(greeting(content.greetingName))}</p>
        ${introHtml}
        ${highlightHtml}
        ${infoHtml}
        ${ctaHtml}
        ${securityHtml}
        ${outroHtml}
        <p style="margin:18px 0 0 0;font-size:14px;line-height:1.6;color:${C.text};">Regards,<br/>The ${esc(APP_NAME)} Team</p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="padding:20px 28px;text-align:center;">
        <p style="margin:0 0 6px 0;font-size:12px;color:${C.muted};">© ${year} ${esc(APP_NAME)}</p>
        <p style="margin:0 0 6px 0;font-size:12px;color:${C.muted};">
          <a href="${esc(APP_URL)}" target="_blank" style="color:${C.brand};text-decoration:none;">${esc(APP_URL.replace(/^https?:\/\//, ""))}</a>
          &nbsp;·&nbsp;
          <a href="mailto:${EMAIL_SUPPORT_EMAIL}" style="color:${C.brand};text-decoration:none;">${EMAIL_SUPPORT_EMAIL}</a>
        </p>
        <p style="margin:0;font-size:12px;color:${C.muted};">
          <a href="${esc(PRIVACY_URL)}" target="_blank" style="color:${C.muted};text-decoration:underline;">Privacy Policy</a>
          &nbsp;·&nbsp;
          <a href="${esc(TERMS_URL)}" target="_blank" style="color:${C.muted};text-decoration:underline;">Terms of Service</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  // Plain-text fallback carries the same important information.
  const textLines: string[] = [];
  textLines.push(content.title.toUpperCase());
  textLines.push("");
  textLines.push(greeting(content.greetingName));
  textLines.push("");
  for (const p of content.intro ?? []) textLines.push(p);
  if (content.highlight) {
    textLines.push("");
    textLines.push(`${content.highlight.label.toUpperCase()}: ${content.highlight.value}`);
  }
  if (content.infoRows && content.infoRows.length > 0) {
    textLines.push("");
    for (const row of content.infoRows) textLines.push(`${row.label}: ${row.value}`);
  }
  if (content.cta) {
    textLines.push("");
    textLines.push(`${content.cta.label}: ${content.cta.url}`);
  }
  for (const n of content.securityNotes ?? []) {
    textLines.push("");
    textLines.push(n);
  }
  for (const p of content.outro ?? []) {
    textLines.push("");
    textLines.push(p);
  }
  textLines.push("");
  textLines.push(`Regards,`);
  textLines.push(`The ${APP_NAME} Team`);
  textLines.push("");
  textLines.push("—");
  textLines.push(`© ${year} ${APP_NAME}`);
  textLines.push(`${APP_URL} · ${EMAIL_SUPPORT_EMAIL}`);
  textLines.push(`Privacy Policy: ${PRIVACY_URL}`);
  textLines.push(`Terms of Service: ${TERMS_URL}`);

  return {
    subject: content.subject,
    htmlBody,
    textBody: textLines.join("\n").trim(),
  };
}
