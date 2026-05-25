# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Keep under 2000 lines. Compress older entries when this grows.

---

## Codebase orientation (bootstrap notes — 2026-05-25)

**Stack:** Pure HTML/CSS/JS, no build step. Vercel static + serverless functions. Upstash Redis backing the dashboard.

**Surface areas:**

- **Public pages (root):** `index.html`, `pricing.html`, `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, `shop.html`, `product.html`. All load `js/main.js` and `css/style.css`.
- **Blog:** `blog/*.html`, 23 standalone articles with inline styles. Use `../` for shared assets.
- **Dashboards (self-contained, no main.js):** `thomas.html` (admin, password-gated) and `client-dashboard.html` (PWA, client portal).
- **Shop frontend:** `js/shop.js`, Shopify Storefront API via Buy SDK CDN.
- **Quiz:** `js/quiz.js`, runs on `index.html` (inline) and `pricing.html` (overlay-gated).
- **Serverless API:** `api/submit-*.js` (public), `api/dashboard/*.js` (admin-gated via session cookie), `api/client/*.js` (client-gated via session cookie), `api/cron/*.js` (CRON_SECRET gated).
- **Auth:** `api/lib/auth.js` (admin, HMAC), `api/lib/client-auth.js` (client, PBKDF2 + HMAC sessions).
- **Service worker:** `sw.js` at root, cache name `telos-v1`, handles push notifications and offline caching for `/client-dashboard`.

**Conventions that matter for triage:**

- Clean URLs via Vercel — internal links omit `.html` (except `index.html#anchor` which is intentional).
- CSS version param `?v=N` on `style.css` is bumped manually when CSS changes.
- The `.product-detail` grid has 2 columns but the markup currently has 3 children — see bug-2026-05-25-01.
- Quiz uses `localStorage.telosQuizCompleted` to gate the pricing page.
- Client sessions use `SameSite=None; Partitioned` (needed for Whop iframe embedding). Admin sessions use `SameSite=Strict`.
- Cron endpoints require `Authorization: Bearer <CRON_SECRET>` header and gracefully skip if `RESEND_API_KEY` is missing.

## Triage heuristics

- **Shopify Storefront tokens are intended to be public** (read-only, scoped). Do not flag the hardcoded `SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js` as a leak. The Admin API token would be a different story.
- **Self-contained dashboards (thomas.html, client-dashboard.html) intentionally do NOT load `js/main.js`.** They have inline JS and their own nav/hamburger handlers. Don't report this as missing.
- **The `chs.html` nav is deliberately minimal** (hotel-site aesthetic). Missing "Client Login" link may be intentional — flag only if Thomas confirms.
- **Pricing styles use `p-` prefix and live inline in `pricing.html`.** Do not flag as duplication; this is the documented pattern.

## Known false-positive patterns

(To be populated from denied bugs over time.)

- *(none yet)*

## Areas explored

- 2026-05-25: API auth (admin + client), submit endpoints, cron jobs, shop.js, product.html grid, quiz.js retake flow, service worker, vercel.json.

## Patterns noticed (2026-05-25)

- **Event handlers attached inside step-functions leak across retakes.** Quiz lead-capture and several inline handlers in quiz.js (retake button, view-pricing button) re-attach on every invocation rather than once at module load. Worth scanning client-dashboard.html and thomas.html for the same anti-pattern next time Functional comes around.
- **Cron jobs send emails but never record the send.** Both `weekly-summary.js` and `engagement-check.js` will happily re-fire on retries (or daily, in engagement's case). If Vercel ever retries a crashed cron run, weekly recap could go out twice the same Monday.
- **The `setting `display: grid` then ignoring child count` pattern** caused the product.html layout break. Worth eyeballing other `.loaded { display: grid; grid-template-columns: ... }` sites — pricing.html and thomas.html have grid layouts that should be audited under Visual/UX day.

## Areas not yet explored

- `thomas.html` admin dashboard interactions (10 tabs of inline JS — large surface).
- `client-dashboard.html` (278KB, lots of inline JS — Home/545/Nutrition/Train/Profile tabs).
- Blog article SEO/schema markup.
- `api/dashboard/client-portal.js` and other CRUD endpoints for clients.
- Push notification subscribe/unsubscribe flow.
- Vercel Web Analytics proxy in `api/dashboard/analytics.js`.
- All client-side training/nutrition logging endpoints in `api/client/`.
