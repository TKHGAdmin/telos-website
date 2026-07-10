# Telos Bug Hunter — Learnings

Accumulated knowledge from daily runs. Compress older entries when this file exceeds 2000 lines.

## Codebase orientation

- Pure static HTML/CSS/JS site + Vercel serverless functions under `/api/`.
- Data lives in Upstash Redis (via `api/lib/redis.js`) — key naming conventions are documented in the "Client Dashboard - Redis Keys" section of the project's CLAUDE.md.
- Two auth systems: admin (`api/lib/auth.js`, cookie `telos_dash_session`) and client portal (`api/lib/client-auth.js`, cookie `telos_client_session`, 3-part token).
- Two crons: `weekly-summary` (Mon 14:00 UTC / 9am ET) and `engagement-check` (daily 15:00 UTC).
- Known backlog documented in CLAUDE.md: tool pages missing main.js, `.html` extensions in internal links, `todayStr()` UTC timezone bug in client dashboard streaks, service worker cache version bump needed. DO NOT re-report these.

## False-positive patterns (do not report)

- Hardcoded Shopify Storefront token in `js/shop.js` — Storefront tokens are intentionally public per Shopify's design. Not a leak.
- Hardcoded Vercel `PROJECT_ID` in `api/dashboard/analytics.js` — project IDs are not secrets, just identifiers.
- `.html` extensions in internal hrefs — already tracked in CLAUDE.md backlog.
- `todayStr()` UTC drift in client dashboard — already tracked in CLAUDE.md backlog.
- Web Push in `api/client/notify.js` doing plaintext POST without VAPID signing — code openly acknowledges it's a stub pending full RFC 8291 implementation.
- Missing session-secret fallback — infrastructure-level, expected to be set via Vercel env.

## Areas explored (2026-07-10, first run)

- All `/api/*.js` endpoints (submit-quiz, submit-email, submit-chs-application, and every client/ + dashboard/ + cron/ handler).
- Auth libraries (`lib/auth.js`, `lib/client-auth.js`, `lib/redis.js`).
- Shared JS: `js/main.js`, `js/quiz.js`, `js/shop.js`.
- HTML skim: `pricing.html` (quiz gating), `chs.html` (form fields), `client-dashboard.html` (grep for tab/drawer references and todayStr).

## Patterns worth watching in future runs

- Multiple endpoints store `client_email:{normalizedEmail}` as a portal-login lookup, but the client DELETE path in `api/dashboard/clients.js` only deletes `client:{id}` and the `clients_index` entry — many downstream keys (email lookup, nutrition_plan, training_program, dailylog, dailylogs_index, etc.) are orphaned. Worth checking if downstream orphans surface as visible bugs.
- Cron jobs use `new Date(now - d * 86400000).toISOString().split('T')[0]` for the "day 0 = today" window. When a cron runs before a client would realistically log for the day (Mon 9am ET), any logic that requires "today logged" behaves badly.
- Every write endpoint that upserts logs (daily-log, training-log, nutrition-log, activity-log, supplement-log, five-four-five) uses the same `client_..._logs_index` ZSET pattern. Consistency is good, but if one shape ever diverges it's a likely bug site.
