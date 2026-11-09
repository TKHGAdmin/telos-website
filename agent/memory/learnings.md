# Bug Hunter Learnings

Running log of patterns observed, false-positive patterns to avoid, and areas of the codebase explored.

## Codebase shape (first-pass)

- Pure static HTML + Vercel serverless functions. No build step.
- Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained — all CSS/JS inline. They do NOT load `js/main.js` or `css/style.css`.
- Admin endpoints under `api/dashboard/*` require `verifySession` (HMAC-signed cookie, timing-safe password compare).
- Client endpoints under `api/client/*` require `verifyClientSession` (separate cookie `telos_client_session`, 3-part token: `{clientId}.{expiry}.{sig}`).
- Redis via Upstash REST, called through a small wrapper in `api/lib/redis.js` with a `redisPipeline()` helper for batched GETs.
- Known limitations are documented in `CLAUDE.md` under "Known Limitations" — do NOT re-flag those as new bugs (todayStr() UTC bug, Whop iframe Safari cookies, tool pages missing main.js backlog, etc.).

## Patterns to watch

- **Shape mismatches between admin UI and client API.** The admin UI (`thomas.html`) and the serverless functions were written by different passes. Fields like `tierAccess` can be stored in one shape by admin (object) and read as another (array) by the client API. Grep for the same field name in `thomas.html` and in `api/client/*` whenever a feature feels "half-wired."
- **`.forEach` / `.indexOf` on fields that might be objects.** Any time client code does `(x || []).forEach(...)` and the writer path is admin UI, verify the admin sends an array.
- **`new Date().toISOString().split('T')[0]`** is the project's "today" string. It is UTC, not local. CLAUDE.md flags this as a known backlog item; do not report it again.

## False-positive patterns (don't report)

- `everfitUrl` field still present in `api/client/me.js` — Everfit was removed, but this is dead code, not a user-facing bug.
- Push notification (`api/client/notify.js`) only partially implements Web Push (no VAPID encryption) — self-documented in code, returns graceful "queued" response.
- Admin password compare in `verifyToken` uses `!==` on HMAC signature — not strictly timing-safe but extremely low practical risk against SHA-256 HMAC. Flag only if other admin-side timing leaks are added.

## Areas explored

- `api/lib/auth.js`, `api/lib/client-auth.js`
- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`
- `api/client/{login, me, training-log, activity-log, supplement-log, nutrition-log, five-four-five, module, modules, send-email, notify, push-subscribe, reset-password, sidemenu}.js`
- `api/dashboard/{modules, clients}.js`
- `api/cron/engagement-check.js`
- `thomas.html` (module save shape at line 2365)
- `client-dashboard.html` (todayStr, modules load)
