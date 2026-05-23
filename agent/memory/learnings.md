# Bug Hunter Learnings

Persistent knowledge across runs. Patterns I notice, false positives to avoid, areas explored.

## Codebase map (so far)

- **Static frontend**: pure HTML/CSS/JS, no build step. Shared `js/main.js` for nav, `js/quiz.js` for the execution score quiz, `js/shop.js` for Shopify Buy SDK.
- **Self-contained dashboards**: `thomas.html` (admin) and `client-dashboard.html` (client portal) inline all their CSS/JS and do NOT load main.js or style.css.
- **API surface**: 3 public POSTs (submit-quiz, submit-email, submit-chs-application), ~24 client endpoints (cookie auth via `telos_client_session`), ~17 admin endpoints (cookie auth via `telos_dash_session`), 2 cron jobs.
- **Storage**: Upstash Redis via REST. All keys documented in CLAUDE.md.

## Known-issue do-not-re-report list

From CLAUDE.md "Known Limitations" / prior April 2026 bug crawl:
- Tool pages missing main.js (P1-P3 backlog)
- `.html` extensions in internal links across blog + several public pages
- `todayStr()` UTC timezone bug in client dashboard streak math
- Service worker cache version (`telos-v1`) not bumped on asset updates
- Whop iframe + Safari/iOS cookie limitation (architectural, requires token-based auth migration)

## Patterns to watch

- **Redis key cleanup on DELETE**: Most admin DELETE endpoints only remove `entity:{id}` and `entity_index`. Associated secondary keys (email lookups, logs, related collections) are NOT cleaned up. Confirmed in `clients.js` (today's report). Likely same shape in other DELETE handlers.
- **Email validation inconsistency**: `submit-chs-application.js` uses a regex, but `submit-quiz.js` only checks truthiness. Anywhere user-supplied email is accepted, check for actual format validation.
- **Unbounded `range` params**: Client log endpoints (`daily-log`, `activity-log`, `five-four-five`) accept arbitrary `range` integers and pipeline that many Redis GETs. Cost/DoS risk for authed users.
- **Inline HTML in emails with raw interpolation**: `client.name`, `firstName`, `body.contentTitle` get string-concatenated into HTML email bodies. Coach-controlled inputs so low risk, but a sanitization layer would be safer.
- **Cron jobs lack de-duplication state**: `engagement-check.js` runs daily and re-sends to the same inactive clients with no "last-sent" tracking.

## False-positive patterns (don't re-report)

(none yet - this list grows from denials in decisions.jsonl)

## Tools I've used here

- `grep -rn` for cross-file pattern matching
- `Read` for full-file inspection of API handlers
- Direct code-tracing of CRUD paths and Redis key flows

## Files explored on first run (2026-05-23)

- All of `api/` (lib + dashboard + client + cron + 3 submit endpoints)
- `js/main.js`, `js/quiz.js`, `js/shop.js`
- `sw.js`, `vercel.json`, `package.json`
- Spot-checked `chs.html`, `index.html`, `shop.html`
- Did NOT deep-read `thomas.html`, `client-dashboard.html` (large self-contained files - save for visual/perf days)
