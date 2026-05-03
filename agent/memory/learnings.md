# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Entries are dated. Compress older sections when this file exceeds 2000 lines.

## Codebase shape (first-pass notes, 2026-05-03)
- Pure HTML/CSS/JS, no build step. Live URL: `https://www.telosathleticclub.com`.
- Public pages: `index.html`, `pricing.html`, `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, plus 23 articles in `blog/`.
- Two dashboards (self-contained, do NOT load `js/main.js` or shared CSS): `thomas.html` (admin), `client-dashboard.html` (client PWA).
- Serverless API surface in `api/` split into root (`submit-*.js`), `cron/`, `client/`, `dashboard/`. Auth helpers in `api/lib/`.
- Redis is Upstash via REST; `api/lib/redis.js` is the only DB layer.
- Two cookie schemes: `telos_dash_session` (admin, SameSite=Strict) vs `telos_client_session` (client, SameSite=None; Partitioned for Whop iframe).

## Known limitations / pre-existing backlog (from CLAUDE.md, do NOT re-report)
- Whop iframe login on Safari/iOS broken by 3rd-party cookie blocking — known, no fix in repo.
- Bug crawl P1-P3 backlog from commit `7fa38ff`: tool pages missing `js/main.js`, `.html` extensions in some internal links, `todayStr()` UTC timezone bug in client dashboard streaks, SW cache version bump needed.
  - These are documented as known. Re-flagging them counts as duplicate noise unless the harm is severe and undocumented, OR a new instance appears outside the original scope.

## Triage heuristics
- A "bug" reported here must be reproducible from the code as it currently sits on the working branch. Speculative bugs ("could break if X") get rejected.
- Stylistic / refactoring suggestions are out of scope. Only flag if a real user impact exists.
- Severity calibration:
  - P0 = production breakage or data exposure for real users.
  - P1 = degraded experience for many users (form fails, layout collapses).
  - P2 = edge cases / minor a11y / non-critical regressions.
  - P3 = polish, deprecated APIs, doc drift.

## False-positive patterns to avoid (seed; expand as denials accrue)
- "Missing `try/catch`" — only flag when an unhandled rejection actually surfaces to the user.
- "No rate limiting" — only flag where the absence is exploitable in practice (admin endpoints already require session auth).
- "Console.log left in production" — log statements in serverless functions are useful for Vercel logs; not a bug.
- ".html in href" — already in CLAUDE.md backlog. Only re-flag if a specific link is broken end-to-end.

## 2026-05-03 — first run notes (Functional focus)
- Filed 3 bugs: stale `client_email` lookup on delete, weekly-summary streak=0 on Monday morning, quiz retake duplicate listeners.
- Cron schedule reads: `vercel.json` `0 14 * * 1` is 9am EST / 10am EDT. CLAUDE.md says "9am ET" — the schedule is winter-time-anchored. Probably intentional, not a bug, but note it.
- `engagement-check.js` correctly tolerates `lastLogDaysAgo === 0`, but `weekly-summary.js` does not — both crons should follow the same rule.
- `verifyToken` in `api/lib/auth.js:27` uses `!==` on the HMAC signature (NOT timing-safe), while `verifyClientToken` in `client-auth.js:49` uses `crypto.timingSafeEqual`. Inconsistent. Save for Day 3 (Security).
- `api/dashboard/login.js` has no rate limit. With the length-leak in `verifyPassword`, brute force is plausible. Save for Day 3.
- `api/client/reset-password.js` has no rate limit on the email-request branch — abuse vector for spamming a target user's inbox. Save for Day 3.
- Areas explored for the first time: all `api/lib/`, all `api/cron/`, `api/submit-*.js`, `api/dashboard/{clients,client-portal,login}.js`, `api/client/{login,daily-log,training-log,food-search,reset-password}.js`, `js/quiz.js`, `chs.html` form-submit code, `vercel.json`.
- Areas NOT yet explored: blog articles, `js/main.js`, the bulk of `client-dashboard.html` (278KB), `thomas.html` (admin dashboard JS), `api/dashboard/{adspend,analytics,content,modules,pipeline,revenue,stats,submissions,emails,upload-video,delete-video,chs-applications}.js`.
