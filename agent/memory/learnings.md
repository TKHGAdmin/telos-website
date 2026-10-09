# Bug Hunter Learnings

Running notes for the Telos Bug Hunter agent. Kept short and action-oriented; compress older entries when this file grows past 2000 lines.

## Codebase map (as of 2026-10-09)

- **Stack:** pure HTML/CSS/JS + Vercel serverless Node.js functions, no build step.
- **Secrets scope:** `SESSION_SECRET`, `DASHBOARD_PASSWORD`, `UPSTASH_REDIS_*`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`, `VAPID_*`. These must only appear in Vercel env, never in repo.
- **Public forms + rate limiting pattern:** `submit-quiz.js`, `submit-email.js`, `submit-chs-application.js` all use `redis('INCR', ratelimit:<ns>:<ip>)` + `EXPIRE 3600`. Use this as the baseline. Any new POST endpoint missing this pattern is a candidate finding.
- **Auth libs:**
  - `api/lib/auth.js` — admin session (`telos_dash_session`, HMAC-signed `expires.sig`). Older code.
  - `api/lib/client-auth.js` — client session (`telos_client_session`, `clientId.expires.sig` + PBKDF2 hashing). Newer code; treat its patterns as the preferred baseline.
- **Known-public tokens** (not findings):
  - Shopify Storefront token in `js/shop.js` is a public-by-design Storefront API token.
  - Open Food Facts proxy requires no key.

## Known false-positive patterns (don't re-flag)

- Shopify Storefront token in `js/shop.js` — intentionally client-side.
- `innerHTML` of coach-authored side-menu `panel` HTML in `client-dashboard.html` — intentional feature; coach is trusted.
- Shopify `product.descriptionHtml` rendered via innerHTML — Shopify sanitizes this upstream and admin is trusted.
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) missing `main.js` — already in CLAUDE.md P1-P3 backlog.
- `.html` extensions still present in a few internal links — already in CLAUDE.md backlog.
- `todayStr()` UTC timezone bug in client-dashboard streaks — already in CLAUDE.md backlog.
- SW cache name `telos-v1` version bump — already in CLAUDE.md backlog.

## Patterns worth hunting again

- Rate-limit coverage: any new auth endpoint (`/api/dashboard/login`, `/api/client/login`, password reset) that forgot the shared ratelimit pattern.
- Timing-safe comparisons: anywhere HMAC or password comparison uses `===`/`!==` or short-circuits on length. Compare against `client-auth.js:49` which does it correctly.
- Username enumeration: any login/reset endpoint that returns different error strings or different timing for "user exists" vs "wrong password".
- Cross-page shared JS: `js/shop.js` has `showEmpty()` that only works on `shop.html` IDs; verify any shared helper reused across pages touches only shared DOM.
- Cache busting: pages should load `js/main.js?v=N` with a consistent N. `chs.html` currently loads `js/main.js` without a version query — low priority but recurring risk when `main.js` changes.
- IDOR surface: client API endpoints must derive `clientId` from `verifyClientSession(req)`, never from a request param. Spot-checked `me.js` and `daily-log.js`; worth a sweep of the full set.

## New areas explored

- 2026-10-09: `api/submit-*.js`, `api/lib/auth.js`, `api/lib/client-auth.js`, `api/dashboard/login.js`, `api/client/login.js`, `api/client/me.js`, `api/client/daily-log.js`, `js/shop.js`, `shop.html`, `product.html`.
