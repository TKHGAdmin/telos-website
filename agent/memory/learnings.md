# Bug Hunter — Learnings

Accumulated knowledge from daily runs. Keep under 2000 lines; compress older entries when needed.

## Architecture notes

- Vercel serverless functions in `/api`, backed by Upstash Redis via a thin `api/lib/redis.js` REST wrapper (no upstash SDK).
- Two distinct auth schemes:
  - Admin (`api/lib/auth.js`) - `telos_dash_session` cookie, token = `{expiry}.{signature}`, `SameSite=Strict`.
  - Client (`api/lib/client-auth.js`) - `telos_client_session` cookie, token = `{clientId}.{expiry}.{signature}`, `SameSite=None; Partitioned` (Whop iframe support).
- Client login lookup key: `client_email:{normalizedEmail}` -> `clientId`. Only written by `api/dashboard/client-portal.js` when portal is enabled; NOT written by `api/dashboard/clients.js` on client create.
- Cron jobs use `Bearer ${CRON_SECRET}` on `Authorization` header (Vercel injects). Both cron scripts fail closed if `CRON_SECRET` unset.
- Dates in Redis keys are UTC `YYYY-MM-DD` (`new Date().toISOString().split('T')[0]`) - known off-by-one risk for clients not in UTC.

## Recurring failure patterns to watch

- Off-by-one on "today" in cron / streak logic because today's log usually doesn't exist yet when the cron fires early in the morning.
- Duplicate email handling is fragmented across `clients.js` (create/update) and `client-portal.js` (enable) - the enable path does NOT check for conflicts.
- `parseInt(x, 10) || 0` inside `Math.max(1, ...)` clamps a legitimate 0 up to 1 (see `api/client/daily-log.js:70-73`).

## False-positive patterns to avoid

- (none recorded yet - update as denials arrive)

## Areas explored

- `2026-09-05`: `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`, `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`, `api/client/login.js`, `api/client/reset-password.js`, `api/client/daily-log.js`, `api/cron/weekly-summary.js`, `api/cron/engagement-check.js`, `api/dashboard/clients.js`, `api/dashboard/client-portal.js` (partial), FAB button code in `client-dashboard.html`.
