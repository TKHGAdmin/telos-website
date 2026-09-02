# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Kept under 2000 lines; older entries collapse into the summary section when needed.

## Codebase orientation

- Vanilla HTML/CSS/JS, no build step. Vercel `cleanUrls: true`, so internal links drop `.html`.
- Marketing pages: `index.html`, `pricing.html`, `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, `shop.html`, `product.html`.
- Dashboards (self-contained, inline CSS/JS): `thomas.html` (admin), `client-dashboard.html` (client PWA).
- API: Vercel serverless functions under `/api/` split by role: `dashboard/*` (admin session), `client/*` (client session), `cron/*` (CRON_SECRET), plus three public `submit-*.js` endpoints.
- Data store: Upstash Redis via a tiny REST client (`api/lib/redis.js`); no npm deps in that path.
- Auth: two cookie-based sessions — `telos_dash_session` (admin, HMAC-signed, `SameSite=Strict`) and `telos_client_session` (client, 3-part token, `SameSite=None; Partitioned` for Whop iframe embedding).
- Shopify Buy SDK v3 UMD is loaded from the Shopify CDN; storefront tokens are public by design (read-only Storefront API), so their presence in `js/shop.js` is expected — do NOT flag as a leaked secret.

## Known-intentional patterns (do not flag)

- Shopify Storefront token committed in `js/shop.js` — public by design.
- `main.js` is deliberately NOT loaded on `thomas.html` or `client-dashboard.html`; those pages are fully self-contained.
- `body.page-load-anim` is scoped to `index.html` only. Other pages omitting it is intentional.
- Tool pages have inline scripts; hamburger/nav handlers are owned by `main.js` and must not be duplicated.
- `.visible` class in shared CSS is scoped to `.animate-on-scroll.visible`; tool result panels using a bare `.visible` do so intentionally.

## Failure-mode notes

- `showEmpty()` in `js/shop.js` only handles `#shopLoading` / `#shopEmpty` (shop.html). On `product.html`, the outer init catch paths (SDK missing, config unset, `createFreshCheckout` throws) call `showEmpty()` which is a no-op there — flagged in the 2026-09-02 report as `product-init-error-silent`.
- `product.html` grid has 3 direct children under `.product-detail.loaded` with a 2-column template; the layout regressed with the image-gallery commit (`f5cb8c4`). Flagged 2026-09-02 as `product-detail-grid-3-children`.

## Areas explored

- 2026-09-02: `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`, `api/dashboard/login.js`, `api/dashboard/chs-applications.js`, `api/client/login.js`, `api/submit-chs-application.js`, `js/shop.js`, `shop.html`, `product.html`, `chs.html` form section, `vercel.json`.

## Areas not yet explored

- Blog articles under `/blog/` (23 files) — cross-check for dead nav links relative to `../`.
- `js/quiz.js` end-to-end logic on both index and pricing contexts.
- `thomas.html` inline dashboard JS (large; 161 KB).
- `client-dashboard.html` inline JS (278 KB) — training rest timer, 545 auto-save, FAB modal flows.
- API endpoints not yet read: adspend, analytics, revenue, content, clients, client-portal, all `/api/client/*` beyond login, all `/api/cron/*`.

## False-positive patterns to avoid

- (None yet — decisions.jsonl is empty on the first run.)
