# Telos Bug Hunter - Learnings

Accumulated knowledge from daily passes. Keep under 2000 lines; compress older entries when exceeded.

## Architecture facts (verified 2026-06-12)

- Two parallel auth systems: `api/lib/auth.js` (admin / `telos_dash_session`) and `api/lib/client-auth.js` (clients / `telos_client_session`). Admin cookie token format is `payload.signature` (2 parts); client cookie is `clientId.expiry.signature` (3 parts).
- Email-to-client lookup uses the key `client_email:{normalizedEmail}` and is created/destroyed in `api/dashboard/client-portal.js` when portal is enabled/disabled. This lookup is the only thing enforcing email uniqueness.
- All API handlers use `module.exports = async function handler(req, res)` (no framework). Vercel auto-parses JSON bodies into `req.body`.
- Redis access via Upstash REST API; `api/lib/redis.js` exposes `redis(cmd, ...args)` for single ops and `redisPipeline(cmds)` for batches. Pipeline returns array of `{ result: ... }` per command.
- Date storage convention: keys end in `:YYYY-MM-DD`. Cron jobs and API range queries derive that string via `new Date(now - d * 86400000).toISOString().split('T')[0]` — UTC, not client local. CLAUDE.md flags this as a known limitation; do not re-report.
- The `/thomas` admin dashboard and `/client-dashboard` are self-contained HTML files with inline CSS/JS. They do NOT load `js/main.js` or `css/style.css`.

## Patterns noticed

- Admin DELETE handlers tend to only clean up the primary record + its index ZSET. They do not chase secondary indexes (e.g. `client_email:`) or per-record sub-keys (e.g. `client_dailylog:{id}:{date}`). Worth scanning every DELETE handler for orphan-data risk.
- IP extraction for rate limiting uses `req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'`. `x-forwarded-for` can be a comma-list when multiple proxies are in play; the whole list becomes the rate-limit key. Probably not exploitable behind Vercel but worth noting.
- Several endpoints use `parseInt(req.query.X) || N` without a radix and without an upper bound. Radix issue is minor in practice but the upper-bound issue can cause memory/pipeline blowup if attacker requests huge ranges.

## False-positive patterns to avoid

(none yet — populate from `decisions.jsonl` denials)

## Bugs reported on 2026-06-12 (functional pass)

- BUG-20260612-01 (P1) — `api/dashboard/clients.js` DELETE leaves `client_email:` lookup orphaned and blocks re-using the email.
- BUG-20260612-02 (P2) — `api/lib/auth.js` `verifyToken` uses `!==` instead of `crypto.timingSafeEqual` (client-auth.js does it correctly).
- BUG-20260612-03 (P2) — Email uniqueness for clients only enforced when portal is enabled; second portal-enable silently overwrites the first.

Do not re-report these in the next 14 days unless still unresolved AND there is a new angle worth flagging.

## Areas not yet explored

- `js/main.js` (nav, scroll animations) - skimmed only
- `blog/*.html` - 23 articles, not opened
- `pricing.html` inline JS for the quiz overlay and tier toggle
- `client-dashboard.html` UI logic (large file, 278KB)
- `thomas.html` UI beyond the client-delete path
- All `/api/dashboard/*` aside from clients, client-portal, chs-applications
- `/api/client/five-four-five.js`, `nutrition-log.js`, `activity-log.js`, `supplement-log.js`, `module*` — not opened
- Module / video upload endpoints
- Push notification flow
