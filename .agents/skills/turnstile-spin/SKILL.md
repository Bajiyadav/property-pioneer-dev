---
name: turnstile-spin
description: Set up Cloudflare Turnstile end-to-end in a project. Scan the codebase, create the widget via the Cloudflare API, embed it where user requests need bot verification, wire canonical server-side siteverify in the customer's existing backend, and validate.
---

# Cloudflare Turnstile Integration Skill

This skill defines the canonical, end-to-end setup and verification for Cloudflare Turnstile across frontend and backend.

## Environment Variables

- `VITE_TURNSTILE_SITE_KEY`: Public widget site key for frontend embedding
- `TURNSTILE_SECRET_KEY` / `TURNSTILE_SECRET`: Private server-side secret key for Cloudflare siteverify endpoint (`https://challenges.cloudflare.com/turnstile/v0/siteverify`)
- `TURNSTILE_HOSTNAMES`: Optional comma-separated list of approved hostnames

## Frontend Widget Embedding

Use the standard Turnstile loader and widget component:

- Explicit or automatic rendering with `action` tag (e.g. `action="enquiry"` or `action="contact"`)
- Handle token expiration and reset widget ID on retry

## Server-side Canonical Siteverify

Verify incoming `cf-turnstile-response` token:

1. Ensure token length is between 1 and 4096 characters
2. POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify`
3. Validate `success === true`
4. If `expectedAction` provided, verify `result.action === expectedAction`
5. If `expectedHostnames` provided, verify hostname allowlist match
