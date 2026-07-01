# Bug Hunter — Learnings

Living notebook. Newest entries at the top. Compress older entries into the "Historical patterns" section once past 30 days or when the file passes 2000 lines.

## Format

Each entry is a dated bullet under a heading of the pattern's category. Keep entries short — one to three sentences. Reference bug IDs and commit SHAs where useful.

---

## Codebase orientation notes

- 2026-07-01 — Static HTML + Vercel serverless (`api/`). No build step, no framework. Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained with inline CSS/JS and do NOT load `js/main.js` or `css/style.css`. Every public marketing page DOES load `main.js`.
- 2026-07-01 — Two separate auth systems: admin (`lib/auth.js`, `telos_dash_session`, 2-part cookie, `SameSite=Strict`) and client (`lib/client-auth.js`, `telos_client_session`, 3-part cookie, `SameSite=None; Partitioned` for Whop iframe). Do not confuse them.
- 2026-07-01 — Redis via Upstash REST client (`lib/redis.js`) — no npm dep. All CRUD flows use `client:{id}`, `client_email:{normalizedEmail}`, per-day logs at `client_{feature}:{clientId}:{YYYY-MM-DD}`, and per-client ZSET indexes.
- 2026-07-01 — Cron endpoints (`api/cron/*`) must fail closed when `CRON_SECRET` is unset. Verify by grepping `if (!process.env.CRON_SECRET)`.

## Known false-positive patterns

- 2026-07-01 — **Node `req.headers` is lowercase.** Do NOT flag `req.headers.authorization !== 'Bearer ' + secret` as a case-sensitivity bug. Node's http module normalizes all incoming request header keys to lowercase; Vercel serverless functions preserve this. The lowercase check is correct.
- 2026-07-01 — **Quiz `countInterval = 1200 / totalScore` is safe.** The 8 questions each contribute at least 1 point, so minimum `totalScore` is 8, not 0. Divide-by-zero is unreachable through the UI.
- 2026-07-01 — **Shopify cart qty=0 via dev console is not a bug.** The Shopify SDK treats quantity=0 as line removal by design, and console manipulation is out-of-model for public checkout UX. Do not report.
- 2026-07-01 — **Fire-and-forget analytics submission is not a race bug.** `js/quiz.js` sets the `telosQuizCompleted` localStorage flag before dispatching the `/api/submit-quiz` POST. User experience is correct in every branch (they always see their score). Missing lead capture on network failure is the accepted tradeoff for a non-blocking UI. Do not report unless the pattern is misapplied to a blocking user action.

## Confirmed real-bug patterns

(none yet — populate from first approvals)

## Historical patterns

(none yet)
