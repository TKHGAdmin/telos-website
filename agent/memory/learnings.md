# Telos Bug Hunter — Learnings

Accumulated knowledge from daily runs. Newest at the top.

---

## 2026-04-23 — Initial run

### Codebase map (first time exploring)
- Pure HTML/CSS/JS site, no build step. Serverless functions in `api/`.
- Data layer is Upstash Redis via a hand-rolled REST client (`api/lib/redis.js`). No ORM, no npm deps.
- Admin auth: `api/lib/auth.js` — HMAC-signed session cookies, timing-safe password check, 7-day expiry.
- Client auth: `api/lib/client-auth.js` — PBKDF2 password hashing, 3-part session tokens.
- Two dashboards, both self-contained (no shared CSS/JS): `thomas.html` (admin) and `client-dashboard.html` (PWA).
- Newest area: Charleston (`chs.html`, `submit-chs-application.js`, `dashboard/chs-applications.js`) — commit 3d87367.
- Recent significant rewrite: nutrition + FAB + supplements + activity (commit 510992e).

### Known backlog (do NOT re-report)
Per CLAUDE.md Known Limitations:
- Whop iframe login broken on Safari/iOS (third-party cookie blocking) — architectural, needs token-based auth.
- P1-P3 bug crawl items (commit 7fa38ff plan file): tool pages missing main.js, .html extensions in internal links, todayStr() UTC timezone bug in client dashboard streaks, SW cache version bump.

### False-positive patterns to avoid
- "Inline CSS should be in a stylesheet" — intentional for dashboards (self-contained by design).
- "No framework, should use React" — intentional, stated in CLAUDE.md.
- "No tests" — no test infrastructure in repo; don't flag as a bug.
- "em dash should be en dash" or similar typography preferences — not bugs.
- Calling out every `.html` extension in internal links — documented backlog item, only flag if new occurrence.

### Patterns noticed
- Redis client is a thin fetch wrapper; command names are passed as strings. Easy place to introduce command-name typos.
- Most API handlers share a shape: method check → verifySession → parse body → redis ops → JSON response. Deviations are worth inspecting.
- `res.setHeader('Access-Control-Allow-Origin', '*')` appears inconsistently — some handlers set it, some don't. Probably fine because functions are same-origin, but worth noting.
- **Cron streak/time-of-day code has a systemic bug pattern**: both `weekly-summary.js` and `engagement-check.js` treat `d = 0` as "today" and check `client_dailylog:{id}:{YYYY-MM-DD(UTC)}`. Since crons run in the morning before most users log, anything that "breaks on first missing day including today" lands on zero. Look for this pattern elsewhere.
- **Orphaned Redis keys on DELETE**: the admin `clients.js` DELETE only removes `client:{id}` + `clients_index` entry. Per-client satellite keys (`client_email:`, `*_index:{id}`, `client_push_sub:`, daily/training/nutrition/545/supplement/activity logs) are not cleaned up. The `client_email:` one is user-blocking; the rest is cruft. Whenever reviewing a new client feature, check both the create-path and the delete-path for key parity.
- **`type="button"` + `.catch(()=>{})` silently drops form submissions**: quiz.js handler advances the UI synchronously and catches any API failure with a no-op. Any future form on the site should be audited for the same pattern.

### Things saved for the Security-focus day (day 3)
- `api/lib/auth.js:27` — admin `verifyToken` uses `signature !== expected` (non-timing-safe). The client-auth version (`client-auth.js:49`) correctly uses `crypto.timingSafeEqual`. Inconsistency worth flagging on the security pass.
- `api/client/login.js` — user enumeration via timing: the email-miss path skips the PBKDF2 (100k iterations), making it measurably faster than the wrong-password path. Confirm on a security day; could be fixed by always running a constant-time dummy PBKDF2 on the miss path.
- `thomas.html` Charleston detail modal embeds `esc(id)` inside `onclick="...(' + esc(id) + ')"`. IDs are server-generated today so not exploitable, but the pattern is fragile — any future user-controlled id would make it XSSable.
