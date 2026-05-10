# Bug Hunter Learnings

Accumulated knowledge from prior runs. Newest entries at top.

## 2026-05-10 — Bootstrap run

First run on the repo. Initialized agent infrastructure (memory dir, reports dir, schema doc, focus-rotation).

### Areas explored for the first time

- `api/client/*` — client portal endpoints (auth, daily logs, nutrition, training, etc.)
- `api/dashboard/*` — admin endpoints behind verifySession
- `api/lib/auth.js`, `api/lib/client-auth.js` — session cookie auth
- `api/lib/redis.js` — Upstash REST wrapper
- `api/cron/*` — weekly summary + engagement email jobs
- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js` — public ingestion endpoints
- `js/quiz.js`, `js/main.js` — client-side flows
- `client-dashboard.html`, `thomas.html` — self-contained dashboards

### Codebase conventions noted

- No build step; pure HTML/CSS/JS + Vercel serverless functions in `api/`.
- Redis access is REST-only via `api/lib/redis.js`; no node-redis.
- Admin auth: `telos_dash_session` cookie, HMAC-signed, `SameSite=Strict`.
- Client auth: `telos_client_session` cookie, 3-part token, `SameSite=None; Partitioned` (for Whop iframe).
- Public endpoints set permissive CORS in `vercel.json`; admin/client endpoints rely on cookie auth.
- Rate limiting is custom + Redis-backed (e.g., `ratelimit:chs:{ip}` for Charleston applications).

### Patterns to watch in future runs

- **Time zones**: CLAUDE.md flags a known `todayStr()` UTC bug in client dashboard streaks. Don't re-report unless fixed. Same UTC-vs-ET issue affects the cron jobs (`weekly-summary.js`, `engagement-check.js`) — they walk last-N-days using `new Date(now - d*86400000).toISOString().split('T')[0]`.
- **Tool pages missing main.js**: Known P1 backlog item from prior bug crawl. Don't re-report unless fixed.
- **`.html` extensions in internal links**: Known P2 backlog item. Already documented.
- **CSS cache-busting `?v=N`**: Bumping is a manual convention. Missing bumps after style.css edits are real bugs.
- **Whop iframe Safari/iOS**: Documented limitation, not a bug.
- **Client lifecycle cleanup**: When a client is deleted via dashboard, tons of dependent keys are orphaned (`client_dailylog:*`, `client_training_log:*`, `client_545_*`, `client_supplement_*`, `client_nutrition_*`, `client_activity_log:*`, `client_modules`, `client_sidemenu`, etc.). The only one that actively breaks a flow is `client_email:{normalized}` — reported P2 in 2026-05-10.
- **Cron suppression**: `engagement-check.js` has no per-client cooldown — emails on every run after day 3 inactivity. Reported P1 in 2026-05-10.
- **Auth HMAC compare**: `api/lib/auth.js` (admin) uses `!==` for signature compare while `api/lib/client-auth.js` (client) uses `crypto.timingSafeEqual`. Inconsistent. Park for security rotation.

### High-value areas confirmed clean on this run

- `api/submit-chs-application.js` — required-field validation, regex email check, IP rate limit (5/hr).
- `api/client/reset-password.js` — token deleted after use, generic 200 response on email-not-found to prevent enumeration.
- `api/client/login.js` — proper portalEnabled + status checks, generic error messages.
- `api/lib/client-auth.js` — PBKDF2 100k SHA-512, timing-safe compare for password and token signature.
- `api/dashboard/chs-applications.js` — verifySession-gated, status whitelist enforced, notes truncated at 4000 chars.

### False-positive patterns to avoid

(none yet — populate as denials accumulate)
