# Learnings — Telos Bug Hunter

Accumulated patterns, false positives to avoid, and codebase notes.

## Infrastructure state (as of 2026-10-25)

On first run the following were missing and had to be created or inferred:

- `agent/memory/learnings.md` (this file)
- `agent/memory/decisions.jsonl` (empty)
- `agent/memory/focus-rotation.json`
- `agent/reports/`

Still missing in the repo:

- `docs/BUG_REPORT_SCHEMA.md` — Report schema was inferred from the agent
  prompt. If a `run.py` orchestrator parses reports, the fields used in
  `2026-10-25.md` are the canonical first attempt. If parsing fails, align
  the schema with the parser instead of the report.
- No `run.py` orchestrator was observed in the repo. Reports are written to
  disk only. Email delivery, if desired, needs to be added at the harness
  layer or scheduled task.

## Codebase map (quick reference)

- Pure HTML/CSS/JS static site, no build step. Vercel-hosted.
- `api/` holds Vercel serverless functions. Three subdirs:
  - `api/client/*` — client portal (requires `telos_client_session` cookie)
  - `api/dashboard/*` — admin (requires `telos_dash_session` cookie)
  - `api/cron/*` — scheduled jobs (requires `CRON_SECRET`)
- Auth libs:
  - `api/lib/auth.js` — admin HMAC session cookie
  - `api/lib/client-auth.js` — client HMAC session cookie, PBKDF2 passwords
- Redis via `api/lib/redis.js` (Upstash REST, no npm deps).
- `client-dashboard.html` and `thomas.html` are self-contained (all CSS/JS
  inline). Public pages share `css/style.css` and `js/main.js`.

## Patterns noticed

- `todayStr()` in `client-dashboard.html` uses `new Date().toISOString()`
  which is UTC. For a US eastern user this flips the "today" key after
  7pm local time. The same helper is reused everywhere a daily log key is
  built (daily check-in, 545, nutrition, training, supplements, activity).
  Any date-indexed feature in the client dashboard is suspect for the same
  bug class — grep for `todayStr(` and audit each caller.
- Rate limiting is applied inconsistently: `submit-quiz.js` and
  `submit-chs-application.js` have per-IP hourly limits via Redis INCR.
  `api/dashboard/login.js` and `api/client/reset-password.js` do not.
- `api/lib/auth.js` `verifyToken` compares HMAC signatures with `!==`
  instead of `crypto.timingSafeEqual`. The client-side equivalent in
  `api/lib/client-auth.js` does it correctly. Any new HMAC verification
  should mirror the client-auth pattern.
- `x-forwarded-for` is used verbatim as the rate-limit key in multiple
  places. The header can contain a comma-separated chain of IPs when
  passing through multiple proxies. Low impact on Vercel (edge terminates
  the chain) but worth noting if ever moved off Vercel.

## False positives to avoid

- (none yet — populate from `decisions.jsonl` denials over time)

## Scope reminders

- Scope is **telos-website only**. FORGE OS, Thomas's run club site, and
  anything else in the account are out of scope.
- No modification of application code. Writes only to `agent/memory/` and
  `agent/reports/`.
- First-run goal is high-precision, low-volume. One confirmed P1 beats
  five speculative P2s.
