# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Newest entries at the top. Compress entries older than ~30 days into a one-line summary if this file grows past 2000 lines.

---

## 2026-05-22 — first run, bootstrap

- Repo had no `agent/` or `docs/` directory on first run. Bootstrapped the structure from scratch (memory files, focus-rotation, schema). Subsequent runs can assume these exist.
- `decisions.jsonl` is empty until Thomas starts approving/denying bugs via the email loop. Until then, trust calibration is impossible. Stay conservative — high-precision findings only.
- The site is a pure HTML/CSS/JS static site with Vercel serverless functions for the dashboard/portal. No build step, no framework — bugs are usually visible directly in `*.html` and `js/*.js`.

### Codebase patterns worth remembering

- **Self-contained pages**: `thomas.html` and `client-dashboard.html` deliberately do NOT load shared `js/main.js` or `css/style.css`. Their `<style>` and `<script>` blocks are inline. Do not flag missing shared-asset references on these two files as bugs.
- **Public Shopify Storefront token**: `js/shop.js` hardcodes a Storefront API token. This token is **designed to be public** — it's how Shopify's headless storefront API works. Do not flag this as a leaked secret.
- **Inline `onclick="..."` with dynamic IDs**: `js/shop.js` builds HTML strings with embedded onclick handlers using Shopify GraphQL IDs (base64 strings with `=` padding). These do not contain single quotes, so the inline-attribute injection is safe in practice. Don't flag unless you can construct a real failing case.
- **`cleanUrls: true` in `vercel.json`**: Links to `shop`, `product`, `pricing` etc. resolve to `*.html` files on Vercel. Local `npx serve` also handles this. Don't flag missing `.html` as broken links.

### Areas not yet explored

- Serverless functions in `api/` (admin auth, client portal endpoints) — security focus day will cover these.
- Blog directory (23 articles) — visual focus day will spot-check responsiveness.
- Service worker (`sw.js`) — performance focus day will check cache versioning.

### Known false-positive patterns to avoid

- Empty — populate as Thomas issues denials via `decisions.jsonl`.
