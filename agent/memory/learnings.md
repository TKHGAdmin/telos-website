# Bug Hunter - Accumulated Learnings

This file records patterns, hotspots, false-positive avoidance, and codebase geography discovered across runs. Keep under 2000 lines.

## Codebase geography

- Static HTML/JS/CSS at repo root. No framework, no build step. Deployed to Vercel with `cleanUrls: true` (see `vercel.json`).
- Serverless functions in `api/`. Three groupings: public (`api/submit-*`), admin dashboard (`api/dashboard/*`, gated by `verifySession` from `api/lib/auth.js`), client portal (`api/client/*`, gated by `verifyClientSession` from `api/lib/client-auth.js`).
- Two separate cookie sessions: `telos_dash_session` (admin, 2-part HMAC, `SameSite=Strict`) and `telos_client_session` (client, 3-part, `SameSite=None; Partitioned` so it survives the Whop iframe).
- Redis is Upstash REST-only, wrapped in `api/lib/redis.js`. Every key convention lives in `CLAUDE.md`; consult it before assuming a schema.
- Two crons in `api/cron/`: weekly-summary (Mon 9am ET) and engagement-check (daily). Both bail early if `RESEND_API_KEY` is missing.

## Recurring hotspot patterns

- **Secondary-index cleanup asymmetry on DELETE.** POST/PUT handlers tend to maintain multiple indexes (main hash, sorted-set index, series/pillar indexes, email lookup), but several DELETE handlers only touch a subset. `api/dashboard/modules.js` DELETE is the reference implementation. `api/dashboard/clients.js` DELETE is the counter-example (misses `client_email:` - see 2026-08-03/BUG-1). Whenever a new POST writes a secondary key, verify the corresponding DELETE removes it.
- **UTC-based date keys.** Both client (`client-dashboard.html`'s `todayStr()`) and server code compute date strings via `new Date(...).toISOString().split('T')[0]`. This is already logged as a P2 backlog item for the client. The server-side crons use the same pattern; when the metric is user-facing (streaks, "today"), it's worth checking whether the ET/UTC drift matters.
- **Streak/consecutive-day loops start at `d=0`.** Both `client-dashboard.html` (line ~3556) and `api/cron/weekly-summary.js` count backward from today, breaking on the first empty day. When today's key is written asynchronously (e.g. a Mon-morning email fires before the client logs), streak reads as 0. See 2026-08-03/BUG-2.
- **`addEventListener` inside re-invoked render functions.** `js/quiz.js` `setupLeadCapture()` and `renderResults()` re-bind click handlers each time; on flow retakes they stack. Any function that runs more than once and calls `addEventListener` on stable DOM nodes should either clone-and-replace or bind once at DOM ready. See 2026-08-03/BUG-3.

## False-positive patterns to avoid re-reporting

- **`notify.js` Web Push stub.** File explicitly documents that RFC 8291 encryption is intentionally deferred and returns a well-formed `{ok:true, queued:true}` response when VAPID keys are absent. Not a bug.
- **Hardcoded Shopify Storefront token in `js/shop.js`.** Storefront API tokens are designed to be public. Not a security issue.
- **Backlog items already logged in `CLAUDE.md` Known Limitations.** Do not re-report: tool pages missing `main.js`, `.html` extensions in internal links, client-side `todayStr()` UTC bug in the dashboard streak display, SW cache version bump. Server-side variants of the streak / timezone bug in different files are fair game as distinct findings.
- **Admin password length leak via `verifyPassword` early length check.** The length check is required for `crypto.timingSafeEqual` to avoid a throw. Length is not a meaningful secret for an admin password of unknown length to an attacker, and mitigating it requires more invasive rewrites. Skip.

## Codepaths reviewed on 2026-08-03

- All `api/submit-*` endpoints.
- All `api/lib/*`.
- All `api/dashboard/*` except `content.js`, `adspend.js`, `stats.js`, `submissions.js`, `emails.js`, `upload-video.js`, `delete-video.js`, `chs-applications.js`, `login.js`, `logout.js`.
- All `api/client/*` login/logout/me/food-search/notify/push-subscribe/reset-password/daily-log/nutrition-log/training-log/five-four-five/mindset/module-progress.
- Both `api/cron/*`.
- `js/quiz.js`, `js/shop.js`.
- Homepage/pricing/shop navigation link audit.

## To-cover next rotation cycles

- `api/dashboard/content.js`, `adspend.js`, `chs-applications.js`, `emails.js`, `submissions.js`, `stats.js`, `upload-video.js`, `delete-video.js`, `login.js`, `logout.js`.
- `api/client/activity-log.js`, `supplement-log.js`, `supplements.js`, `resources.js`, `sidemenu.js`, `training-program.js`, `modules.js`, `module.js`, `send-email.js`, `push-unsubscribe.js`.
- `thomas.html` (161 KB, self-contained admin dashboard - large surface area, likely rich in bugs).
- `client-dashboard.html` beyond the streak logic - training rest timer, macros math, PWA install path, session cookie expiry handling.
- Blog articles' schema.org JSON-LD validity.
- `sw.js` cache invalidation and push handler.
