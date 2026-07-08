# Telos Bug Hunter - Learnings

Accumulated knowledge across runs. Compress older entries when this file exceeds 2000 lines.

---

## Run 2026-07-08 (Day 0, Functional focus)

**First run.** No prior decisions to learn from. Establishing scaffolding.

### Codebase notes

- Pure HTML/CSS/JS, no build step. Vercel serverless functions in `api/`.
- Data layer is Upstash Redis via REST API (`api/lib/redis.js`).
- Two auth systems: admin (`api/lib/auth.js`, HMAC-signed session cookie `telos_dash_session`, `SameSite=Strict`) and client (`api/lib/client-auth.js`, PBKDF2 hashes, `telos_client_session` cookie, `SameSite=None; Partitioned` for Whop iframe embedding).
- Recent commits (May 2026): shop/product pages using Shopify Buy SDK v3, CHS landing page.
- Older backlog per CLAUDE.md: "todayStr() UTC timezone bug in client dashboard streaks" - still noted as unresolved. Worth verifying whether already reported vs. in-flight before flagging again.

### Areas explored this run
- `api/submit-chs-application.js` - Charleston application intake, rate-limited.
- `api/lib/auth.js`, `api/lib/client-auth.js` - auth flows.
- `shop.html`, `product.html` - Shopify integration (most recently touched).
- `api/cron/weekly-summary.js`, `engagement-check.js` - Vercel cron.
- Client API endpoints in `api/client/*.js`.

### Patterns / heuristics to remember
- CLAUDE.md flags known limitations (Whop iframe on Safari/iOS). Do not re-report these as bugs unless the fix has landed and regressed.
- `bug crawl P1-P3 backlog` referenced in CLAUDE.md (commit 7fa38ff) - check that plan file before flagging seemingly obvious issues.
- Admin dashboards (`thomas.html`, `client-dashboard.html`) are self-contained HTML with inline CSS/JS. Do NOT flag "missing shared stylesheet include" - it's intentional.
- Body class `page-load-anim` is intentionally only on `index.html`. Not a bug elsewhere.
- Tool pages (protein-calculator, hyrox-predictor) may lack `main.js` include - this is noted in the P1-P3 backlog. Confirmed known before flagging.

### Focus rotation
- 0=Functional, 1=Visual/UX, 2=Performance, 3=Security
- Today: Functional. Next: Visual/UX.

### Findings this run
- BUG-20260708-01 (P1): `api/dashboard/clients.js` DELETE orphans `client_email:` lookup key. Follow up next Security day: same class of stale-key issue could affect `password_reset:` tokens if the client is deleted while a reset token is outstanding.
- BUG-20260708-02 (P2): `api/cron/weekly-summary.js` streak = 0 on Monday morning because loop starts at d=0 (today, not yet logged).

### Patterns to watch on future runs
- Redis lookup keys (`client_email:`, `password_reset:`, `ratelimit:*`) — audit all DELETE/lifecycle paths that could leave orphans.
- Any date-based iteration `for (d=0; d<N; d++)` in code that runs on a schedule — `d=0` may or may not represent "already-populated today" depending on cron time. Compare weekly-summary vs engagement-check heuristics next.
- Cache-busting query strings on shared assets: `chs.html` loads `js/main.js` with no `?v=` while every other page uses `?v=2`. Not a bug now, but if main.js is bumped to `?v=3`, chs users will keep getting old cached versions. Note for Visual/UX day.
