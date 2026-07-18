# Bug Hunter - Accumulated Learnings

This file is my working memory across runs. Compressed periodically; oldest entries drop when it exceeds 2000 lines.

## Codebase mental map (as of 2026-07-18)

- Static site + Vercel functions. No build step. All shared UI logic in `js/main.js`, `js/quiz.js`, `js/shop.js`. Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained with inline `<script>` — do NOT load `main.js`. Any bug I find in main.js does not affect the dashboards.
- Two auth systems, both in `api/lib/`:
  - `auth.js` = admin (`/thomas`), HMAC-signed cookie `telos_dash_session`, SameSite=Strict.
  - `client-auth.js` = clients, PBKDF2 100k SHA-512, cookie `telos_client_session`, SameSite=None+Partitioned for Whop iframe.
- Data model = Upstash Redis. Keys are documented in `CLAUDE.md` under "Client Dashboard - Redis Keys". Client-scoped keys always look like `client_{thing}:{clientId}` or `client_{thing}:{clientId}:{YYYY-MM-DD}`. Indexes use ZSET `{thing}_index:{clientId}` scored by epoch.
- Every client endpoint calls `verifyClientSession(req)` and returns 401 without one. Every admin endpoint calls `verifySession(req)`.
- Cron endpoints (`api/cron/*`) require `req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET`. They fail closed if `CRON_SECRET` is unset.

## Repeatable patterns worth checking each run

- **UTC vs local-day bugs**: `todayStr()` in client-dashboard.html and many API endpoints use `new Date().toISOString().split('T')[0]`, which is UTC. This is already tracked in CLAUDE.md's Known Limitations — do NOT re-report as a fresh bug.
- **.html extensions in internal links**: Many `nav-logo` and blog back-links still use `index.html` instead of `/`. Also in P1-P3 backlog per CLAUDE.md. Do NOT re-report.
- **Endpoint shape drift**: Client-portal admin endpoint returns fields renamed (`ffsGoals`, `ffsRoutine`) that don't match the client-side variable names (`five-four-five...`). Worth watching for stale bindings.
- **Duplicate error message paths**: Login and reset-password use similar guards. Reset explicitly protects against email enumeration; login does not. When reviewing new auth endpoints, cross-check that they follow the reset-password pattern of collapsing "not found" and "wrong credentials" into one response.
- **Cron streak/date math**: Any cron that walks backwards from `Date.now()` and looks up today's data will hit the "today not yet logged" hole at UTC midnight. Check for `for (var d = 0; ...)` loops in cron files.

## False-positive patterns to avoid

- `SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js` is a public storefront token, designed to be embedded in client code. It is NOT a leaked secret.
- Timing-safe comparison is missing in `api/lib/auth.js:verifyToken` (uses `!==` on HMAC signatures) but timing attacks on HMAC hex strings are not practical for an attacker without the SESSION_SECRET. Reporting this as a security bug is noise unless a real practical attack exists.
- The `verifyPassword(input)` length-check timing leak in `auth.js:52-58` leaks the DASHBOARD_PASSWORD length. This is one password for one coach. Not worth flagging unless a hardening pass is requested.
- Missing timing-safe compare on admin token verification — same reason as above, low practical value.

## Known backlog (do not re-report as bugs)

Documented in CLAUDE.md's "Known Limitations":
- Whop iframe on Safari/iOS: cross-site cookies blocked. Documented workaround exists.
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) missing `main.js`.
- `todayStr()` UTC timezone bug in client dashboard streaks.
- SW cache version bump needed on cached asset changes.
- .html extension internal links in blog files and a few root pages.

## Run history

- **2026-07-18** (Functional): First run. Bootstrapped memory. Found 4 bugs: P2 weekly-summary streak, P2 duplicate-email guard, P2 quiz score inflation via multi-click, P3 login enumeration. No decisions.jsonl signal yet.
