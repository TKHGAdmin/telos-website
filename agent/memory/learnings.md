# Bug Hunter Learnings

Accumulated knowledge from daily runs. Patterns to repeat, false-positives to avoid.

---

## Codebase shape (initial survey, 2026-05-29)

- Pure HTML/CSS/JS, no build step. Vercel serverless functions live under `api/`.
- Two auth surfaces with separate session cookies: admin (`telos_dash_session`, SameSite=Strict) and client (`telos_client_session`, SameSite=None; Partitioned).
- All persistence is Upstash Redis via a tiny REST wrapper in `api/lib/redis.js`. Many keys carry "secondary indexes" alongside the primary record (e.g. `client_email:{email}` -> id; `client_dailylogs_index:{clientId}` ZSET). Anywhere a primary record can be deleted, look for orphaned secondary keys.
- All `client_dailylog`, `client_training_log`, etc. dates are stored as `YYYY-MM-DD` derived from `new Date().toISOString().split('T')[0]` on the client. This is UTC, not local. Already known per CLAUDE.md.
- `index.html#...` and other `.html` extensions remain in internal links across many pages; CLAUDE.md flags this as a known P1-P3 backlog item, so do NOT re-report.
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) lack `js/main.js`. Already known per CLAUDE.md - do NOT re-report.
- `todayStr()` UTC vs. local timezone in client dashboard streaks is already known - do NOT re-report.
- SW cache version (`telos-v1`) bump pending per CLAUDE.md known list - do NOT re-report.

## Patterns to keep hunting

- Redis "delete primary but leak secondary" - the `client_email:` orphan reported today (P2) was found by greping `client_email` across all callers and noticing the `clients.js` DELETE handler made no cleanup call. Apply the same pattern to other primary/secondary pairs: `clients_index`, `chs_applications_index`, `client_*_logs_index`, `password_reset:{token}`, anywhere `ZADD`/`SET` pair appears at creation but only one half cleans up.
- Cron endpoints with no "lastSent" / "last processed" tracking re-fire on every tick. Today's engagement-check (P2) is the example. Check any cron that sends emails/notifications for idempotency or throttling.
- `innerHTML` writes of admin-supplied content (sidemenu custom panel, Shopify product description) are intentional - coaches/store admin can intentionally embed HTML. NOT a bug unless the source is end-user data.

## False-positive patterns to skip

- Internal links with `.html` extension - tracked in CLAUDE.md, no need to report.
- `verifyPassword` early-returns on length mismatch in `api/lib/auth.js` - timing-attack flavour but content is admin-only single-tenant, and the leak (password length) is negligible. Don't escalate as P0.
- The Shopify storefront access token in `js/shop.js` is a *public* token (storefront API), not a secret. Different from Admin API key. Not a credential leak.
- `client_email` lookup not created at `clients.js` POST is by design - the lookup is only authoritative when portal is enabled (via `client-portal.js`). Don't report this as a bug.

## Areas explored

- All public-submission endpoints (`api/submit-*.js`)
- Both auth libraries (`api/lib/auth.js`, `api/lib/client-auth.js`)
- Client portal endpoints (login, reset-password, daily-log, training-log, food-search)
- Admin endpoints (login, clients, client-portal, chs-applications)
- Cron jobs (engagement-check, weekly-summary)
- Marketing pages link integrity (top-level + nav consistency)
- Quiz logic in `js/quiz.js`
- Shop integration in `js/shop.js`

## Areas not yet explored (TODO future runs)

- Service worker `sw.js` push notification handling
- Blog article rendering / link integrity
- `js/main.js` interactivity (cursor, tilt, counters)
- Admin endpoints: pipeline.js, revenue.js, content.js, adspend.js, analytics.js, modules.js, upload-video.js
- Client endpoints: notify.js, push-subscribe.js, send-email.js, supplements.js, activity-log.js, mindset.js, resources.js
- Image asset references / missing files
