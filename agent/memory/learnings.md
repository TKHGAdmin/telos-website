# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Kept under 2000 lines; older entries summarized when full.

## Codebase mental model
- Pure static HTML + Vercel serverless functions. No build step, no framework.
- Two auth surfaces:
  - **Admin**: `api/lib/auth.js` — single shared `DASHBOARD_PASSWORD`, HMAC session cookie `telos_dash_session`, `SameSite=Strict`.
  - **Client**: `api/lib/client-auth.js` — per-client PBKDF2 hash + salt on the client record, HMAC session cookie `telos_client_session`, `SameSite=None; Partitioned` (Whop iframe).
- **Rate limiting** is done inline in each endpoint via a Redis `INCR` on `ratelimit:<scope>:<ip>` with a 1-hour TTL. Only some endpoints do it. Pattern is copy-pasted, so it's easy to grep for `ratelimit:` to spot which endpoints are protected.
- Client dashboard (`client-dashboard.html`) and admin dashboard (`thomas.html`) are self-contained: inline CSS/JS, do not load `js/main.js` or `css/style.css`.
- Shop stack is new (recent commits): `shop.html`, `product.html`, `js/shop.js` — uses Shopify Buy SDK v3, Storefront token is intentionally public.

## Endpoints WITH rate limiting (as of 2026-09-19)
- `api/submit-quiz.js` (10/hr per IP)
- `api/submit-email.js` (10/hr per IP)
- `api/submit-chs-application.js` (5/hr per IP)
- Several `api/dashboard/*` write endpoints (session-authed, still throttled)

## Endpoints WITHOUT rate limiting where it matters
- `api/dashboard/login.js` — brute-forceable admin login
- `api/client/login.js` — brute-forceable per-client login
- `api/client/reset-password.js` — unbounded Resend email spend + user email spam

## False-positive patterns to avoid
- `crypto.timingSafeEqual` with buffers of different byte lengths throws. Both auth libs pre-check length before the call, so this is not a bug.
- Shopify GID / base64 line-item IDs and CDN image URLs don't contain quotes; the `onclick="fn('${id}')"` pattern in `shop.js` isn't exploitable in practice with real Shopify data. Not worth reporting on its own.
- `client.name` in the password reset email HTML is coach-set, not user-set. Not stored XSS.
- Storefront token (`c1876...`) in `js/shop.js` is Shopify's public Storefront API token — designed to ship to the browser. Not a leak.

## Known / already-tracked bugs (do not re-report)
- `todayStr()` in `client-dashboard.html` uses `toISOString().split('T')[0]` — UTC-based day boundary, drifts streaks for users west of UTC. Listed in CLAUDE.md's "Bug crawl P1-P3 backlog." Same pattern is present in most `api/client/*` handlers when computing "today," but that is server-side and consistent, so it is a different concern.
- Whop iframe login on iOS Safari does not persist auth. Listed in "Known Limitations."

## Areas explored
- `api/lib/` (auth, client-auth, redis client)
- `api/client/login.js`, `api/client/reset-password.js`, `api/client/notify.js`, `api/client/food-search.js`, `api/client/daily-log.js`
- `api/dashboard/login.js`
- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`
- `js/shop.js` (product listing, product detail, cart drawer)
- `sw.js` (service worker cache + push handler)

## Areas not yet explored
- `thomas.html` dashboard JS (large file, 50+ `.innerHTML` sites — needs a careful review for stored-XSS on quiz/lead fields)
- Client dashboard training / 545 / nutrition UI flows
- Blog article link hygiene
- `api/dashboard/upload-video.js` and Vercel Blob usage
- `api/cron/*` scheduled jobs
