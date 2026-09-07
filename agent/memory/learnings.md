# Telos Bug Hunter - Learnings

## Codebase orientation

- **Stack**: Pure HTML/CSS/JS static site + Vercel serverless functions in `api/*` (CommonJS `module.exports = handler`). No build step. Upstash Redis via REST for all state.
- **Auth split**:
  - Admin (`/thomas`) uses `lib/auth.js`: `telos_dash_session` HMAC-signed cookie, timing-safe password check against `DASHBOARD_PASSWORD`, `SameSite=Strict`.
  - Client portal uses `lib/client-auth.js`: `telos_client_session = {clientId}.{expiry}.{signature}`, PBKDF2-SHA512 (100k, 64 bytes) for passwords, `SameSite=None; Partitioned` for Whop iframe support.
  - Both share `SESSION_SECRET`.
- **Rate-limit pattern**: `INCR ratelimit:{scope}:{ip}` + `EXPIRE ... 3600`. Used in `submit-quiz`, `submit-email`, `submit-chs-application`. Not used elsewhere by default - check when auditing public endpoints.
- **Redis convention**: `{entity}:{id}` for single blobs, `{entity}_index` ZSETs scored by `Date.now()` (creation order), `client_{feature}:{clientId}:{YYYY-MM-DD}` for per-day data with sibling `client_{feature}_logs_index:{clientId}` ZSET for date lookups.
- **Client email uniqueness** relies on a reverse-lookup key `client_email:{normalizedEmail} -> {clientId}`, only written when portal is enabled. Writers/readers: `dashboard/client-portal.js` (SET on enable, DEL on disable), `dashboard/clients.js` PUT (on email change), `client/login.js` GET, `client/reset-password.js` GET. Deletion of a client does NOT touch it - see 2026-09-07 report BUG-001.

## Known false-positive traps

- `todayStr()` UTC drift in `client-dashboard.html:1840` - explicitly listed in CLAUDE.md's P1-P3 backlog. Do NOT re-report.
- Service-worker cache name `telos-v1` static across dashboard changes - explicitly listed in CLAUDE.md's P1-P3 backlog. Do NOT re-report.
- Tool pages missing `main.js` / `.html` extensions in internal links - explicit CLAUDE.md backlog. Do NOT re-report unless a *new* page adds a fresh violation.
- Whop iframe + Safari third-party cookie limitation - documented "Known Limitation".

## Endpoint text-length caps seen so far

Set as reference so future audits can spot omissions like BUG-2026-09-07-003:
- `training-log.js` notes: 1000
- `five-four-five.js` goal text: 500; routine step: 300; daily task text: 500
- `chs-applications.js` notes: 4000
- `daily-log.js` notes: **unbounded** (bug reported today)
- `activity-log.js` activity object: **unbounded** (not reported today; behind auth and shape-dependent; watch on future runs)
- `nutrition-log.js` meals array: **unbounded** (same posture; watch)

## Env-var expectations

`DASHBOARD_PASSWORD`, `SESSION_SECRET`, `UPSTASH_REDIS_REST_KV_REST_API_URL/TOKEN`, `SITE_URL`, `RESEND_API_KEY`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN`, optional `VERCEL_API_TOKEN`, `VAPID_*`. `verifyPassword('')` returns true if `DASHBOARD_PASSWORD` is unset, but `login.js` blocks empty input first (`if (!password || ...)`), so this is not a live bug in isolation - re-check any *new* consumer of `verifyPassword`.

## Focus-rotation notes

- Day-0 Functional took ~1 pass over `api/*`. Highest-yield spots: DELETE handlers (invariant cleanup), public unauthenticated POSTs (rate limits), text-length caps on client-write endpoints.
- Next Day-1 Visual/UX passes should focus on: nav-link consistency across new pages (`shop.html`, `product.html`), mobile responsive breakpoints on new pages, alt text and aria on the cart drawer, contrast on gold-on-black CTAs.
