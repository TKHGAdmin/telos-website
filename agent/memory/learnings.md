# Bug Hunter Learnings

Accumulated knowledge across runs. Kept under 2000 lines; oldest entries get compressed.

## Codebase notes

- Pure HTML/CSS/JS static site + Vercel serverless functions. No build step.
- Shared: `js/main.js` (nav, hamburger, scroll anim, tilt), `js/quiz.js` (Execution Score Quiz on index + pricing), `js/shop.js` (Shopify Buy SDK integration).
- Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained; they do NOT load `main.js` or `style.css`.
- Cache-busting: `?v=N` suffix on shared assets. Currently `css/style.css?v=16` and `js/main.js?v=2` sitewide. `js/shop.js` is **inconsistent** — see 2026-08-26-2.
- Backend: Upstash Redis via `api/lib/redis.js`. Auth: HMAC-signed cookies via `api/lib/auth.js` (admin) and `api/lib/client-auth.js` (client PBKDF2 + session token).
- All internal links are supposed to be clean URLs (no `.html`). CLAUDE.md flags remaining `.html` links as a known P1-P3 backlog item; do NOT re-report them.

## Known false-positive patterns (do not report)

- **Shopify Storefront token in client bundle** — Storefront tokens are designed to be public and scoped read-only. `SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js` is intentional. Only flag an admin/API token, not a storefront token.
- **`.html` extensions in internal links** — already known and documented in CLAUDE.md as a P1-P3 backlog item (tool pages missing main.js, `.html` extensions, todayStr() UTC bug, SW cache bump). Reporting them again is noise.
- **`innerHTML` of `product.descriptionHtml`** in shop.js — Shopify's `descriptionHtml` is authored by the store admin (Thomas) and meant to render as HTML. Not a real XSS vector unless the admin's own account is compromised.
- **`document.body.style.overflow = 'hidden'` inside `toggleCart`** — intentional to lock scroll while cart drawer is open.

## Areas explored

- 2026-08-26: shop.html, product.html, js/shop.js, api/lib/client-auth.js, api/client/login.js, api/dashboard/pipeline.js. Skimmed the file tree; deep-read the shop/product cart flow and client auth.

## Patterns worth watching

- The shop feature is the newest surface area (added over the last few commits). New CSS grid + dynamically inserted DOM = highest bug density right now. Re-scan it whenever a shop-related commit lands.
- `main.js` version is sitewide at `?v=2`. When `main.js` changes, every one of the 28 pages needs bumping — grep-driven diff on the next visual-UX pass would catch a missed page.
- Redis-backed endpoints follow a consistent shape (verifySession → try/catch → JSON). Deviations (missing verifySession, missing method guard, missing 500 handler) are the most likely security regressions.

## Report hygiene

- A zero-bug day is a valid report. Do not pad.
- Confirm every finding by reading the exact code/lines. Do not report from memory.
