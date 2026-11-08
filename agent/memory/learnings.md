# Bug Hunter — Learnings

Accumulated knowledge across runs. Oldest entries at the top; compress when the file exceeds 2000 lines.

---

## 2026-11-08 — First run

### Codebase overview (functional focus)
- Pure HTML/CSS/JS site on Vercel, with serverless functions in `api/`.
- Admin auth (`api/lib/auth.js`) uses HMAC-SHA256 cookie tokens, 7-day expiry, timing-safe password compare.
- Client auth (`api/lib/client-auth.js`) uses PBKDF2-SHA512 (100k iter) + HMAC token; timing-safe signature compare.
- Redis via Upstash REST (no npm deps). Pipelined reads common in cron jobs.
- Rate limiting pattern: `ratelimit:{scope}:{ip}` via INCR + EXPIRE on first increment. Only applied on public submission endpoints (quiz, email, chs application).

### Patterns worth watching
- `api/cron/*.js` jobs iterate all clients in one pass and send emails without tracking the last-send timestamp. Prime hunting ground for duplicate-notification bugs.
- Several endpoints compute date keys with `new Date(now - d * 86400000).toISOString().split('T')[0]` — UTC-based. The CLAUDE.md known-limitations backlog already mentions a `todayStr()` UTC timezone bug for streaks; treat UTC date boundaries as already-known and do not re-report.
- Admin dashboard/login and client/login have no rate limiting. Dashboard-side is mitigated by env-var password strength; client-side is a legit brute-force surface.
- `verifyClientToken` does not check `isNaN(parseInt(expires))`. Only exploitable with SESSION_SECRET access, but a latent logic bug.
- Admin `auth.js:verifyToken` uses `!==` to compare HMAC signatures. Inconsistent with client-auth.js (which uses `timingSafeEqual`).

### Framework gaps noted on first run (NOT a bug — infrastructure)
- `docs/BUG_REPORT_SCHEMA.md` does not exist. Report format used today was improvised from the system prompt; the schema contract Thomas controls should be authored before the parser needs it.
- No `run.py` orchestrator present at repo root.
- `agent/memory/` + `agent/reports/` did not exist; bootstrapped on this run.

### False-positive patterns to avoid next run
- Do not re-report the UTC date-boundary issue in daily-log / streaks / cron date keys — already in the project's known P1-P3 backlog (see CLAUDE.md Known Limitations).
- Do not report the Whop iframe third-party cookie issue — explicitly documented as a known limitation in CLAUDE.md.
- Style-preference comments on email templates are out of scope.
