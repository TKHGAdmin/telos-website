# Telos Bug Hunter — Learnings

This file is the agent's accumulated knowledge across runs. Patterns observed, false-positive shapes to avoid, and codebase context that's expensive to re-derive every run.

Keep this under 2000 lines. Compress older entries into summaries when needed.

---

## 2026-05-27 — bootstrap run (functional focus)

First run. No prior reports, no prior decisions. Created the agent infrastructure:
- `agent/memory/{learnings.md, decisions.jsonl, focus-rotation.json}`
- `agent/reports/` directory
- `docs/BUG_REPORT_SCHEMA.md`

### Codebase shape notes
- Static HTML/CSS/JS site. No build step. Vercel serverless functions in `/api`. Upstash Redis for state.
- Auth: two distinct flows. Admin (`api/lib/auth.js`, cookie `telos_dash_session`, 2-part token, SameSite=Strict). Client (`api/lib/client-auth.js`, cookie `telos_client_session`, 3-part token, SameSite=None+Partitioned for Whop iframe).
- Public POST endpoints with rate limiting: `submit-quiz` (10/hr), `submit-email` (10/hr), `submit-chs-application` (5/hr). All use `ratelimit:{name}:{ip}` keys in Redis.
- Client API endpoints derive `clientId` from session — no IDOR risk on the ones spot-checked (training-log, daily-log, nutrition-log).
- Cron endpoints check `Bearer ${CRON_SECRET}` and fail closed if env var missing.

### Known issues already documented in CLAUDE.md (do NOT re-report)
- `todayStr()` UTC timezone bug in client-dashboard.html — documented as affecting "streaks" but actually affects ~40 call sites across daily-log/nutrition/training/545/activity/supplement keys (same root cause, single fix).
- Tool pages duplicate hamburger logic / miss `js/main.js`.
- Internal links using `.html` extension despite `cleanUrls: true`.
- Service worker cache version (`telos-v1`) needs bumping when cached assets change.
- Whop iframe + Safari/iOS: client login broken because Safari blocks third-party cookies regardless of SameSite. Documented limitation.

### False-positive shapes to avoid
- Reporting "fail-loud" env-var-missing behavior (e.g. `createHmac` with undefined SESSION_SECRET throws → 500) as "P0 fail-unsafe". This is actually fail-closed: the request errors out, no data is exposed. Not a bug, just expected behavior when ops misconfigures. Mark as noise.
- `engagement-check.js` line 46 uses UTC date keys for client log lookup. This matches the buggy client-side `todayStr()` UTC keys, so the cron is consistent with current data layout. Don't flag as a separate bug.

### Worth checking next time
- Admin signature comparison in `auth.js:27` uses `!==` (not timing-safe), while `client-auth.js:49` uses `timingSafeEqual`. Flagged this run as P3.
- Client login error messages distinguish "email not found" vs "portal disabled" vs "inactive" vs "no password" vs "wrong password" — user enumeration oracle. Flagged this run as P2.
- Visual/perf/security rotations have not run yet. Bundle sizes, image weights, CSP headers, axe checks all unexplored.
