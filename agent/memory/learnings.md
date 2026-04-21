# Telos Bug Hunter — Learnings

Accumulated knowledge from past runs. Keep under 2000 lines. Compress older entries into summaries when threshold reached.

## Codebase map

- Pure HTML/CSS/JS static site + Vercel serverless functions under `/api/`
- Two auth systems: admin (`telos_dash_session`, HMAC) and client (`telos_client_session`, PBKDF2 + HMAC)
- Upstash Redis via REST (see `api/lib/redis.js`)
- No build step; no bundler; no TypeScript
- Admin dashboard: `thomas.html` (self-contained, 10 tabs)
- Client portal: `client-dashboard.html` (self-contained PWA)

## Known false-positive patterns

_(populated as denials accumulate)_

## Confirmed signal patterns

_(populated as approvals accumulate)_

## Patterns noticed

- **Admin auth vs client auth inconsistency**: `api/lib/auth.js` (admin) uses `!==` for HMAC signature compare; `api/lib/client-auth.js` uses `crypto.timingSafeEqual`. When auditing, always cross-compare the two libraries - any security primitive present in one and missing in the other is a candidate finding.
- **Rate limiting pattern**: Only the 3 public submit endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`) implement `INCR` + `EXPIRE` on `ratelimit:*:{ip}`. Admin login, client login, reset-password, and all authenticated endpoints have no rate limiting. Check this whenever a new POST endpoint lands.
- **IP derivation**: All three existing rate limiters key on raw `req.headers['x-forwarded-for']`. Vercel appends client IP rather than replacing, so the raw header is attacker-influenceable. Same footgun will bite any new rate limiter copied from these files.
- **esc() helper**: `client-dashboard.html:1831` builds a textNode and reads innerHTML - correct HTML escape. It does NOT scrub URL protocols, so `javascript:` survives when the escaped value is used as an `href` attribute. Scope: coach-authored content only so far.
- **Client-side IDs from session**: Authenticated client endpoints (daily-log, training-log, five-four-five, etc.) all pull clientId from `verifyClientSession(req)` rather than from query/body. No IDOR surface there.
- **Admin endpoints auth**: All 14 non-login dashboard endpoints call `verifySession` at top of handler. Pattern is consistent.
- **Cron endpoints**: `weekly-summary.js` and `engagement-check.js` check `Bearer ${CRON_SECRET}` and fail closed if missing.

## Known false-positive patterns

_(populated as denials accumulate)_

## Confirmed signal patterns

_(populated as approvals accumulate)_

## Run history

### 2026-04-21 (first run, security focus, bootstrap)
- Created agent/memory/, agent/reports/, docs/BUG_REPORT_SCHEMA.md from scratch.
- Reported 5 security findings (1 P1, 4 P2). See 2026-04-21.md.
- Explored: api/lib/*, all 14 dashboard endpoints by name, ~8 client endpoints in depth, 3 public submit endpoints, 1 cron, ~15 of 65 innerHTML sinks in client-dashboard.html.
- Not yet explored: pipeline.js, content.js, adspend.js, revenue.js, modules.js (admin), thomas.html innerHTML sinks, blog pages, sw.js, quiz.js, main.js.
