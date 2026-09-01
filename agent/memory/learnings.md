# Bug Hunter Learnings

Accumulated knowledge from daily runs. Keep under 2000 lines; compress older entries when needed.

---

## 2026-09-01 (Run #1 — Functional)

### Repo shape
- Pure static HTML + client-side JS. No build step. Vercel-hosted.
- Marketing pages: `index.html`, `pricing.html`, `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, plus `blog/*.html`.
- **New shop pages** (not yet in `CLAUDE.md`'s project-structure listing): `shop.html`, `product.html`, `js/shop.js`. These integrate Shopify Buy SDK (Storefront API) client-side.
- Serverless functions live under `api/`. Redis via Upstash REST.

### Patterns worth remembering
- Product-detail layout uses a two-column CSS grid but the HTML has three grid children (image, thumbs, info) — a recurring shape to double-check whenever a page adds a sibling to a grid container.
- Storefront API tokens (e.g. `js/shop.js:15`) are DESIGNED to be public. Do **not** flag them as leaked secrets. Same for VAPID public keys.
- `x-forwarded-for` on Vercel is user-influenceable (an attacker can prepend spoofed hops). If a rate limit key is built from it verbatim, the limit is bypassable — but only flag on Security-focus days, and prefer `x-vercel-forwarded-for` in fixes.

### False-positive patterns to avoid
- `.visible` class on `.animate-on-scroll` — legitimate, scoped in shared CSS per `CLAUDE.md`.
- Client-side Shopify credentials — not a secret leak.
- CSS `?v=N` cache-buster version drift between JS files (`main.js?v=2`) and CSS (`?v=16`) — intentional independent versioning.

### Areas not yet explored
- `api/client/*` endpoints (35+ files).
- `api/dashboard/*` endpoints.
- Blog articles (23 files).
- Service worker (`sw.js`) push notification path.
- `client-dashboard.html` (278KB — biggest surface).
- `thomas.html` admin dashboard (161KB).
