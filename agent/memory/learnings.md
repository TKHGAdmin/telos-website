# Bug Hunter — Learnings

Running log of patterns observed across runs. Keep under 2000 lines.

## 2026-11-14 — Day 1 (bootstrap)

First run. Infrastructure bootstrapped (agent/, docs/BUG_REPORT_SCHEMA.md). No prior runs to learn from.

### Codebase at a glance

- Pure HTML/CSS/JS, no build step, no npm deps for app code.
- API = Vercel serverless functions in `api/`. Only lib deps are node built-ins + a hand-rolled Upstash REST client.
- Two self-contained HTML dashboards: `thomas.html` (admin) and `client-dashboard.html` (PWA). All CSS/JS inline.
- Auth: admin uses `telos_dash_session` cookie (2-part HMAC). Client uses `telos_client_session` (3-part: clientId.expiry.sig).
- Redis is called through `api/lib/redis.js` using a tiny REST-based wrapper (no npm).

### Known limitations already documented (per CLAUDE.md)

Do not re-report these:
- Whop iframe on Safari/iOS: third-party cookie blocked. Known.
- P1-P3 backlog from April 2026 bug crawl (commit 7fa38ff): tool pages missing main.js, .html extensions in internal links, `todayStr()` UTC timezone bug in client dashboard streaks, SW cache version bump needed.

### Patterns to watch for in future runs

- Session cookie parsing edge cases (multi-value cookies, URL-encoded values)
- Timing-safe comparisons for secrets (CLAUDE.md claims these; verify against code)
- Rate limiting on public endpoints (quiz, email capture, CHS)
- Input validation on admin CRUD endpoints (XSS stored, length limits)
- CORS on API routes — vercel.json sets headers, but verify
- Redis key naming consistency between writer and reader

### False-positive patterns to avoid

(empty — populate from denials once decisions.jsonl has data)

### Patterns found on 2026-11-14 run

- `client_email:` reverse-lookup is set/torn-down in `client-portal.js` (on portal enable/disable) and `clients.js` PUT (on email change while portal enabled). It is NOT set in `clients.js` POST and NOT torn down in `clients.js` DELETE. Root of 2 reported bugs.
- Rate-limit pattern across the codebase is `ratelimit:{scope}:{ip}` via `INCR` + `EXPIRE`. Used in `submit-quiz`, `submit-email`, `submit-chs-application`. Conspicuously absent from `dashboard/login.js` and `client/reset-password.js`.
- Timing-safe compare is used in `client-auth.js` and `auth.js::verifyPassword` but NOT in `auth.js::verifyToken` — inconsistent.
- Several emails interpolate `client.name` directly into HTML (reset-password, weekly-summary, engagement-check). Admin-controlled, so low priority, but worth a pass on Security day.
- Cron jobs iterate `clients_index` and fan out `redisPipeline` reads per client. Fine at current scale but will N+1 with large client counts — note for Performance day.
- DELETE handlers across the API rarely clean up ZSET indexes or per-entity keys. Pattern worth a dedicated audit on a future day.

