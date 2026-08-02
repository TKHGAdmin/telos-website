# Telos Bug Hunter - Learnings

Accumulated knowledge across runs. Compressed when it exceeds 2000 lines.

## Codebase orientation

- Pure static HTML/CSS/JS site plus Vercel serverless functions in `api/`. No framework, no build step.
- Two auth systems: admin (`api/lib/auth.js`, cookie `telos_dash_session`) and client (`api/lib/client-auth.js`, cookie `telos_client_session`).
- All data lives in Upstash Redis via `api/lib/redis.js` (REST wrapper, no npm deps).
- Public marketing pages load `js/main.js` (shared nav, animations). Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained.
- New shop stack introduced May 2026: `shop.html`, `product.html`, `js/shop.js`. Uses Shopify Buy SDK v3 loaded from `sdks.shopifycdn.com`. Storefront token is embedded client-side (Shopify design — public token, not a secret).

## Patterns observed

- Almost every API endpoint follows the same shape: verify session → parse body → mutate Redis → return JSON. Consistent error shape (`{ error: string }` on failure, `{ ok: true, ... }` on success).
- Rate-limit pattern uses `INCR` + one-shot `EXPIRE` on `count === 1`. Applied to `submit-quiz` (10/hr) and `submit-chs-application` (5/hr). Not applied to other public form endpoints (e.g. `submit-email`).
- Date scoring in ZSETs uses `Date.now()` for creation-ordered indexes and `new Date(yyyy-mm-dd).getTime()` (UTC midnight) for day-ordered indexes.
- Client-side XSS escaping helper in `js/shop.js` (`escapeHtml`) uses a textNode round-trip — escapes `<>&` but NOT quotes. Fine for text content but risky in attribute values built via string concatenation.
- Cache busting is via `?v=N` query strings on `<link>` and `<script>` tags. Version must be bumped on every referencing page when the asset changes.

## Areas explored on this run

- Shop stack: `shop.html`, `product.html`, `js/shop.js`.
- Auth: `api/lib/auth.js`, `api/lib/client-auth.js`, `api/client/login.js`.
- Public submissions: `api/submit-chs-application.js`, `api/submit-quiz.js`.
- Client data: `api/client/daily-log.js`, `api/client/food-search.js`.
- Admin CRUD: `api/dashboard/clients.js`, `api/dashboard/pipeline.js`, `api/dashboard/login.js`.

## Not yet explored

- Every `api/client/*` endpoint besides login/daily-log/food-search.
- `api/cron/*` endpoints.
- `api/dashboard/client-portal.js` (large, handles portal enablement + password creation — worth a look next Functional run).
- Full `js/main.js` and `js/quiz.js`.
- Blog articles under `/blog/` (23 files).
- `client-dashboard.html` and `thomas.html` (both self-contained, thousands of lines).
- `sw.js` service worker.

## Known false-positive traps (avoid re-reporting)

- `verifyPassword` in `api/lib/auth.js` returns early on length mismatch. This is a deliberate tradeoff — `timingSafeEqual` requires equal-length buffers, so an early return is the only option. Password length leak is negligible for a single-secret admin cookie system.
- Shopify Storefront tokens (`SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js`) are designed to be public. Not a secret leak.
- CLAUDE.md already documents a "todayStr() UTC timezone bug in client dashboard streaks" as a known P1-P3 backlog item — do not re-report the client-dashboard.html streak/date bug.
- CLAUDE.md documents "tool pages missing main.js" as backlog — do not re-report.
- `api/client/daily-log.js` GET uses UTC-based date slicing (`toISOString().split('T')[0]`); this is the same class of bug as the known `todayStr()` issue — treat as covered.

## Notes for future runs

- The shop feature is new and moves fast. Every touch of `js/shop.js` or `product.html`/`shop.html` risks the ?v= cache-busting inconsistency and grid-layout regressions. Check these files first on Functional and Visual/UX days.
- When reviewing admin endpoints, watch for missing paired-index writes (e.g. creating `client:{id}` without also creating `client_email:{email}`), which can cause silent lookup failures downstream.
