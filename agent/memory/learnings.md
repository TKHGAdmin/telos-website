# Bug Hunter Learnings

This file accumulates patterns, false-positive avoidance notes, and codebase knowledge across runs.

## Codebase map (initial pass)

- Backend is plain Node/CommonJS serverless functions in `api/`. No TypeScript, no tests.
- All persistence goes through `api/lib/redis.js` (REST-based Upstash, single-command + pipeline).
- Two auth layers: admin (`api/lib/auth.js`, cookie `telos_dash_session`) and client (`api/lib/client-auth.js`, cookie `telos_client_session`). Admin cookie is single-purpose; client cookie is `SameSite=None; Partitioned` for Whop iframe.
- Date keys for daily logs use `new Date(...).toISOString().split('T')[0]` everywhere - both client and server treat dates as UTC. The CLAUDE.md acknowledges this as a known P1-P3 backlog item; skip re-reporting.
- Cron jobs (`api/cron/*`) require `CRON_SECRET` and run unconditionally daily/weekly. None of them deduplicate sends against prior-day sends.

## Known-issue ignore list (do NOT re-report)

These are documented in CLAUDE.md under "Known Limitations" / "Bug crawl P1-P3 backlog":

- Whop iframe login on Safari/iOS - third-party cookie limitation, requires token auth refactor
- Tool pages (protein-calculator, hyrox-predictor) missing main.js
- `.html` extensions in some internal links
- `todayStr()` UTC timezone bug in client dashboard streaks (line 1840-1842 of client-dashboard.html)
- Service worker cache name `telos-v1` needs a bump (sw.js:4)

## False-positive patterns (avoid)

- (none yet - first run)

## Confirmed bug-prone areas

- **Dashboard email lookup**: `client_email:{normalized}` is only written when portal is enabled, not at client creation. This means duplicate-email uniqueness is only enforced for portal-enabled clients, and SET overwrites do not guard against existing owners. Worth grepping every code path that writes `client_email:` for a guard.
- **Cron deduplication**: There is no `email_sent:{client}:{type}:{date}` tracking. Any cron added later that emails clients should add this.
- **Quiz UX**: `js/quiz.js` advances on click without debouncing or disabling buttons during animation. Any auto-advance pattern in this codebase should be audited for the same flaw.

## Architectural observations

- The Redis abstraction returns parsed JSON for `GET` from pipeline (key `r.result`). Bare `redis('GET', ...)` returns the raw string. Mixing the two is a footgun.
- Almost all endpoints use `crypto.timingSafeEqual` for sensitive comparisons, EXCEPT `api/lib/auth.js:27` which uses `signature !== expected`. Flag if it remains after this report.

## Areas not yet explored

- `blog/` (23 static HTML files)
- `thomas.html` (161KB, single-page admin)
- `client-dashboard.html` (278KB, single-page client portal) - only date-handling spot-checked
- Push notification flow (`notify.js`, `push-subscribe.js`)
- Modules / learning content (`modules.js`, `module-progress.js`)
- Vercel Blob video upload (`upload-video.js`, `delete-video.js`)
