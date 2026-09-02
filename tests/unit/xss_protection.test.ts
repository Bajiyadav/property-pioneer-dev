import { describe, it, expect } from "vitest";
import { stripHtml, escapeHtml, sanitizeUrl, sanitizeObject } from "@/lib/sanitize";

describe("XSS Protection & HTML Injection Defense Suite", () => {
  it("1. Strips malicious <script> tags and payloads", () => {
    const malicious = '<script>alert("xss")</script>Beautiful 2BHK Apartment';
    const cleaned = stripHtml(malicious);
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("alert");
    expect(cleaned).toContain("Beautiful 2BHK Apartment");
  });

  it("2. Strips malicious <img onerror=...> tags", () => {
    const malicious = '<img src="invalid" onerror="alert(document.cookie)">Spacious Villa';
    const cleaned = stripHtml(malicious);
    expect(cleaned).not.toContain("<img");
    expect(cleaned).not.toContain("onerror");
    expect(cleaned).toContain("Spacious Villa");
  });

  it("3. Strips malicious event handlers and SVG payloads", () => {
    const malicious = '<svg onload="alert(1)"><a href="javascript:alert(1)">Click</a></svg>';
    const cleaned = stripHtml(malicious);
    expect(cleaned).not.toContain("<svg");
    expect(cleaned).not.toContain("onload");
    expect(cleaned).toContain("Click");
  });

  it("4. Blocks dangerous javascript: and vbscript: URL schemes", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("about:blank");
    expect(sanitizeUrl("JAVASCRIPT:alert(document.domain)")).toBe("about:blank");
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBe("about:blank");
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("about:blank");
    expect(sanitizeUrl("https://seedhaproperties.com/images/prop.jpg")).toBe(
      "https://seedhaproperties.com/images/prop.jpg",
    );
  });

  it("5. Escapes dangerous HTML entities (&, <, >, \", ')", () => {
    const text = "Owner & Tenant <agreement> \"terms\" 'notes'";
    const escaped = escapeHtml(text);
    expect(escaped).toBe(
      "Owner &amp; Tenant &lt;agreement&gt; &quot;terms&quot; &#x27;notes&#x27;",
    );
  });

  it("6. Recursively sanitizes nested object payload properties", () => {
    const dirtyPayload = {
      title: 'Luxury Flat <script>alert("hacked")</script>',
      description: "Near metro <img src=x onerror=alert(1)>",
      specs: {
        facing: 'East <b onmouseover="alert(1)">Facing</b>',
        notes: "Clean valid text",
      },
      tags: ["2BHK", "<script>alert(2)</script>Gated"],
    };

    const clean = sanitizeObject(dirtyPayload);
    expect(clean.title).toBe("Luxury Flat ");
    expect(clean.description).toBe("Near metro ");
    expect(clean.specs.facing).toBe("East Facing");
    expect(clean.specs.notes).toBe("Clean valid text");
    expect(clean.tags[1]).toBe("Gated");
  });
});
