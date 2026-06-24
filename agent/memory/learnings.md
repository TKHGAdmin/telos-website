# Bug Hunter Learnings

Living notebook. Append-only (compress when > 2000 lines). Sections grouped by theme.

## Bootstrap - 2026-06-24

First run. No prior reports, no prior decisions. Created:

- `docs/BUG_REPORT_SCHEMA.md` (parser contract — do not break)
- `agent/memory/focus-rotation.json` (cycle: Functional → Visual/UX → Performance → Security)
- `agent/memory/decisions.jsonl` (empty — no approval/denial signal yet)
- `agent/memory/learnings.md` (this file)

Without a `decisions.jsonl` signal the baseline is to stay conservative: only
report high-confidence, reproducible bugs. Start narrow, earn approvals.

## Code map (Telos)

- All app code is **JavaScript, no TypeScript, no build step.** Vercel
  serverless functions live under `api/`. Front-end is plain HTML + inline JS
  + `js/main.js` + `js/quiz.js` + `js/shop.js`.
- Three big pages are **self-contained** (inline CSS/JS, do NOT load
  `js/main.js`): `thomas.html`, `client-dashboard.html`. They are huge — read
  by region, not whole.
- Authoritative project notes live in the top of `CLAUDE.md`. It already calls
  out a known P1-P3 backlog (`todayStr()` UTC timezone bug in client
  dashboard streaks, SW cache version bump, tool pages missing main.js,
  `.html` extensions in some internal links). **Do not re-report these.**

## Patterns to look for

- **Redis lookup integrity.** Several `client_email:` and similar reverse
  lookups are only maintained on some code paths. Bug class: write to the
  primary record but skip the lookup. Check every endpoint that mutates a
  field used as a key.
- **Method allowlist gaps.** Each `api/**.js` handler runs through
  if-chains by method; missing `POST` after `GET` is the classic.
- **Date string from `new Date().toISOString().split('T')[0]`** — runs in
  Vercel UTC, not the client's TZ. Often correct on the server, but mismatches
  any UI that builds the date from client-local `new Date()`. CLAUDE.md
  already flags one such bug in the client dashboard.
- **Front-end debounce.** `setTimeout(..., N)` auto-advances are vulnerable
  to multi-click within N ms. Look for buttons that don't disable themselves
  on first click.

## False-positive patterns to avoid

(No denials yet; populate as `decisions.jsonl` accumulates.)

- Suggested rule: don't report "could be more robust" or "should validate X
  even though the front-end already does" unless there is a reachable trigger.
- Suggested rule: don't report missing `Content-Type: application/json` on
  401/405 paths in handlers that use `res.end()` instead of `res.status().json()` —
  the JSON body is still valid, no UI is broken.
- Suggested rule: do not report email-enumeration timing on `client/login.js`
  or `client/reset-password.js` — both intentionally return generic responses.

## Endpoint inventory (first pass — 2026-06-24)

Public:
- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`

Client (cookie: `telos_client_session`, three-part token, SameSite=None Partitioned):
- `login`, `logout`, `me`, `reset-password`, `daily-log`, `training-log`,
  `training-program`, `nutrition-log`, `nutrition-plan`, `food-search`,
  `five-four-five`, `activity-log`, `supplement-log`, `supplements`,
  `sidemenu`, `mindset`, `resources`, `modules`, `module`,
  `module-progress`, `push-subscribe`, `push-unsubscribe`.

Admin (cookie: `telos_dash_session`, two-part token, SameSite=Strict):
- `login`, `logout`, `stats`, `submissions`, `emails`, `pipeline`,
  `clients`, `client-portal`, `revenue`, `content`, `adspend`,
  `analytics`, `modules`, `upload-video`, `delete-video`,
  `chs-applications`, plus `client/notify` and `client/send-email` (both use
  the admin session, despite living under `api/client/`).

Crons (require `Authorization: Bearer ${CRON_SECRET}`):
- `weekly-summary` (Mon 14:00 UTC), `engagement-check` (daily 15:00 UTC).
