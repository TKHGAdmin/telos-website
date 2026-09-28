# Telos Bug Hunter — Learnings

Accumulated knowledge from daily hunts. Compress into a summary when this exceeds 2000 lines.

---

## 2026-09-28 (Day 1, Bootstrap)

### Environment / conventions
- The agent directory (`agent/memory/`, `agent/reports/`) did not exist before this run — I bootstrapped it.
- `docs/BUG_REPORT_SCHEMA.md` does not exist yet. I inferred a schema for the report itself (see the first entry in `agent/reports/`) — future runs can lift this into `docs/` when Thomas is ready.
- Focus rotation stored as an index (0=Functional, 1=Visual/UX, 2=Performance, 3=Security). Today = Functional (bootstrap, index 0).
- Working branch is `claude/ecstatic-gauss-ybmcpd` (per session-start instructions).
- Report and memory files are committed to git — Thomas can review the diff to approve/deny findings.

### Codebase orientation notes
- Stack is pure HTML/CSS/JS, Vercel serverless functions, Upstash Redis. No test suite exists, no `package.json` deps beyond serve. `npm test` and `tsc` are not options — hunting is manual code review + optional live-site fetching.
- API surface: `api/lib/{auth,client-auth,redis}.js` are the shared primitives; every dashboard endpoint gates on `verifySession` (admin), every client endpoint on `verifyClientSession`.
- Redis is used as the sole database. There is no ORM, so foreign-key style cleanups on delete are entirely manual — this is a *systematic* source of orphan-data bugs (see BUG-2026-09-28-01).
- CLAUDE.md documents a P1-P3 backlog from April 2026 (commit 7fa38ff). Known items I intentionally did NOT re-report:
  - Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) missing `main.js`.
  - `.html` extensions in internal links across nav + footer.
  - `todayStr()` in `client-dashboard.html:1840` uses `toISOString()` (UTC) — misidentifies "today" for clients in Western time zones after ~8pm local.
  - `sw.js` cache version bump needed.

### Signals to watch for on future functional runs
- Any `redis('DEL', ...)` that only removes 1-2 keys when the record has more indexes / lookups. Look for orphaned secondary indexes.
- `parseFloat(x) || null` / `parseInt(x) || null` on user data — zeros get silently coerced to null (see BUG-2026-09-28-04).
- Cron jobs that iterate over `new Date().toISOString().split('T')[0]` — timezone assumptions bite when the cron runs mid-day UTC.
- Cron jobs without a "sent already this window" throttle key — daily crons hit the same user daily until the underlying condition changes.

### False-positive traps to avoid
- The `SHOPIFY_STOREFRONT_TOKEN` hardcoded in `js/shop.js:15` looks like a leaked secret but is actually a Storefront API token, which is *designed* to be public (Shopify's equivalent of a publishable key). Do NOT re-flag.
- Fallback pattern `req.headers['x-forwarded-for'] || 'unknown'` looks spoofable but Vercel overwrites `x-forwarded-for` on ingress, so on production it is trustworthy. Only worth reporting if it changes.
- `SameSite=None; Partitioned` on the client session cookie is intentional (Whop iframe embedding), not a security regression — this is documented in CLAUDE.md.
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) not loading `main.js` is a known backlog item, not a fresh bug.

### Areas explored today
- All 6 `api/dashboard/*` DELETE handlers (skimmed).
- Full read of: `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`, `api/submit-quiz.js`, `api/submit-chs-application.js`, `api/dashboard/clients.js`, `api/dashboard/client-portal.js`, `api/dashboard/chs-applications.js`, `api/dashboard/modules.js`, `api/cron/weekly-summary.js`, `api/cron/engagement-check.js`, `api/client/{login,reset-password,daily-log,five-four-five,training-log,modules,module,module-progress,send-email}.js`.
- Skimmed: `js/shop.js`, `js/main.js`, `client-dashboard.html` (only around `todayStr` and `toISOString` call sites), `product.html`, `shop.html`.

### Areas NOT yet explored (queue for future runs)
- Full read of `client-dashboard.html` (278k, will need targeted focus).
- Full read of `thomas.html` (161k).
- All `api/client/*` endpoints I did not open: `activity-log.js`, `food-search.js`, `mindset.js`, `notify.js`, `nutrition-log.js`, `nutrition-plan.js`, `push-{subscribe,unsubscribe}.js`, `resources.js`, `sidemenu.js`, `supplement-log.js`, `supplements.js`, `training-program.js`, `logout.js`, `me.js`.
- `sw.js` (service worker).
- `js/quiz.js`.
- All blog HTML files.
