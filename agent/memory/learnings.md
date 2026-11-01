# Telos Bug Hunter - Learnings

Accumulated knowledge from daily bug hunts. Keep tight. Compress older entries if this exceeds 2000 lines.

## 2026-11-01 (first run, Functional focus)

### Codebase shape
- Pure HTML + Vercel serverless Node functions. No build step.
- All backend routes in `api/` use CommonJS, bare `fetch` to Upstash via `api/lib/redis.js`.
- Admin auth: HMAC-signed cookie `telos_dash_session` via `api/lib/auth.js` (single password, no user record, 7-day expiry).
- Client auth: `telos_client_session` with `{clientId}.{expiry}.{sig}`, PBKDF2 (SHA-512, 100k) for password hashing in `api/lib/client-auth.js`.
- Redis keys and conventions documented in `CLAUDE.md`. The admin dashboard is `thomas.html` (self-contained, 161 KB). Client dashboard is `client-dashboard.html` (278 KB).

### Known limitations (documented in CLAUDE.md - don't re-flag)
- `todayStr()` in client-dashboard.html returns UTC date, not local → streak off-by-one in some tz. Already in the P1-P3 backlog.
- Whop iframe on Safari/iOS blocks third-party cookies — client portal login fails there.
- SW cache name bump pending.
- Tool pages missing main.js in some cases.
- Internal links with `.html` extensions.

### Patterns worth watching next cycle
- Several cron / email endpoints have no idempotency / cooldown and no state to track "last email sent".
- `x-forwarded-for` is used directly as a rate-limit key in `submit-*.js` — spoofable by just varying the header.
- Several API handlers write JSON-serialized blobs under `client:{id}` with ad-hoc field whitelists; silent data loss risk when a field name typos.
- UTC date strings are used everywhere as date keys; cross-TZ clients will have inconsistent "today".
- Email HTML templates interpolate `client.name` without escaping (admin-controlled → stored content, low-impact XSS to self).

### False-positive patterns to avoid
- The `verifyToken` signature compare uses `!==` not `timingSafeEqual`. For HMAC with a 256-bit secret the practical attack cost is enormous — don't report as P0/P1. Flag only if a project-level security review is explicitly in scope.
- Operator precedence in `food-search.js` (`a || b * c / 100 || 0`) is intentional and correct; the `||` chain-with-arithmetic reads oddly but works.
- `Math.max(1, Math.min(5, parseInt(x,10) || 0))` in `daily-log.js` can snap 0 → 1 when a client intentionally sends 0. The underlying scales are 1-5 only, so a client never has a legitimate 0 to send. Not a bug.
