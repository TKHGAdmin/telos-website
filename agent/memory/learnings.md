# Telos Bug Hunter — Learnings

This file accumulates patterns, false-positive heuristics, and codebase notes across runs. Keep it under 2000 lines.

## Report schema (used until a canonical one is added at `docs/BUG_REPORT_SCHEMA.md`)

Each daily report lives at `agent/reports/YYYY-MM-DD.md` and contains:

1. Header block: focus area, run number, bug count by severity, approval status.
2. One section per bug, with stable ID `BUG-YYYY-MM-DD-NN`. Each section has these labeled subsections:
   - **Where** — file paths and line numbers
   - **What** — what's wrong, with code excerpts where they clarify
   - **Reproduction** — concrete steps a human can follow
   - **Impact** — who is affected and how
   - **Suggested fix** — short, not prescriptive; sketch only
   - **Confidence** — High / Medium / Low + one-sentence justification
3. Trailing "Notes for next runs" section.

## Codebase shape (initial map)

- Static HTML/CSS/JS hosted on Vercel; serverless functions under `/api/`.
- Public marketing pages: `index.html`, `pricing.html`, `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, plus 23 articles in `/blog/`.
- Self-contained dashboards: `thomas.html` (admin) and `client-dashboard.html` (client PWA). Both load their own inline CSS/JS and do NOT use `js/main.js` or `css/style.css`.
- Shared front-end behavior lives in `js/main.js` and `js/quiz.js`.
- API auth: admin via `telos_dash_session` HMAC-signed cookie (lib/auth.js); client via `telos_client_session` PBKDF2-hashed (lib/client-auth.js).
- Redis (Upstash) is the only data store. No SQL, no ORM.

## Codebase areas explored on 2026-05-02 (Functional)

- All three public-submission endpoints (`api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`) — looked sound: validation, rate limiting, CORS handled correctly.
- Admin clients endpoint (`api/dashboard/clients.js`) — found delete/email-lookup orphan bug.
- Client portal admin endpoint (`api/dashboard/client-portal.js`) — only place where `client_email:` lookup is written.
- Client login (`api/client/login.js`) — fine; relies on `client_email:` lookup that the portal-enable flow creates.
- Both crons (`api/cron/weekly-summary.js`, `api/cron/engagement-check.js`) — found duplicate-send bug in engagement-check.
- Quiz front-end (`js/quiz.js`) and the `<form>` on index/pricing — found bypassable lead capture.
- CHS form (`chs.html`) — clean, has both client-side validation and server-side validation.
- Protein-calculator + hyrox-predictor email gates — clean, use real `<form>` submit handlers.

## Patterns to watch for in future runs

- **`<button type="button">` inside a `<form>`**: HTML5 `required` is a no-op. Whenever lead capture or critical input forms are gated, verify either (a) button is `type="submit"` and handler is on `form.submit`, or (b) the click handler does explicit validation. Quiz form is the worst offender so far.
- **Cron jobs without "last sent" tracking**: any daily cron that sends user-visible email/notification needs a per-recipient throttle. Check every new cron added.
- **Admin DELETE endpoints in `api/dashboard/*.js`**: most do `redis DEL` on the primary key + `ZREM` on the index, but several auxiliary keys are written elsewhere (e.g., `client_email:`, `client_dailylog:*`, `client_545_*`, etc.). Anywhere an entity has secondary indexes, DELETE should clean them up.
- **`fetch(...).catch(function(){})` swallowing errors**: silently OK for analytics-style fire-and-forget, but a problem when the UI advances regardless of API failure (e.g. quiz lead capture). Worth grepping each run.

## Areas not yet explored (candidates for future runs)

- `client-dashboard.html` (~278KB inline file) — Home FAB, training rest-timer, 545 daily logic, nutrition macros math.
- `thomas.html` (~161KB inline file) — admin client/portal/training editors.
- `js/main.js` — nav, hamburger, scroll observers, tilt, cursor.
- Blog HTML for SEO/Schema.org issues (better suited to Visual/UX day).
- Service worker `sw.js` — push notification + cache logic.
- Push subscribe / unsubscribe / notify endpoints.

## Hardcoded / sensitive-looking values (not bugs, just notes)

- `api/dashboard/analytics.js` line 6 hardcodes `PROJECT_ID = 'prj_dfnyWZyIiFSPuIvCAreFxwPNYpdY'`. Vercel project IDs are not secrets but tying source to a single project is a coupling worth noting; revisit on Security day.
- `api/lib/auth.js` `verifyToken` uses `signature !== expected` for the HMAC compare instead of `crypto.timingSafeEqual`. Practical risk is low (network jitter dominates remote timing channels), but the client-auth lib already uses timingSafeEqual. Worth flagging on Security day.

## False-positive patterns to avoid

- (none yet — populate after first denials)

## Confirmed-real bug patterns

- (pending Thomas's first round of approvals)

## Known issues already accepted by Thomas (do NOT re-report unless still unresolved after a fix attempt)

- Whop iframe on Safari/iOS: cookie-based client login does not work in third-party context. Documented in CLAUDE.md "Known Limitations".
- Bug crawl P1-P3 backlog (April 2026, commit 7fa38ff) — already triaged: tool pages missing main.js, .html extensions in some internal links, todayStr() UTC timezone issue in client dashboard streaks, SW cache version bump needed.
