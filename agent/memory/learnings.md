# Bug Hunter Learnings

Living notes on what the codebase looks like, recurring patterns, and what counts as signal vs noise. Keep under 2000 lines; compress oldest entries when over.

## Codebase map (verified 2026-06-01)

- Vanilla HTML/CSS/JS site on Vercel. No build step. Public marketing pages load `js/main.js` + `css/style.css`. Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained inline.
- API routes in `api/` are Vercel serverless functions. Each is a `module.exports = async function handler(req, res)`.
- Public submission endpoints: `submit-quiz.js`, `submit-email.js`, `submit-chs-application.js`. All rate-limit by IP via Redis `INCR` + `EXPIRE`.
- Admin auth: HMAC-signed cookie (`telos_dash_session`), `verifySession(req)` gate at top of every dashboard handler. Timing-safe password compare in `api/lib/auth.js`.
- Client auth: PBKDF2 (100k iter, SHA-512) + HMAC token `{clientId}.{expires}.{sig}`. Cookie `telos_client_session`. Email lookup keyed by normalized lowercase email at `client_email:{email}`.
- Email lookup writes happen in: `clients.js` PUT (on email change while portalEnabled) and `client-portal.js` POST (on enable). NOT in `clients.js` POST creation.
- Pipeline helper `redisPipeline` does NOT check `data.error` like `redis()` does -- callers iterate `r.result` so an Upstash error response would throw at `.forEach`.

## Patterns to watch

- **Event listeners in long-lived UI flows**: `addEventListener` without removal in handlers that may be re-entered (retake quiz, modal reopen) is a frequent source of duplicated network calls. See 2026-06-01 P1 finding.
- **Inconsistent input validation across sibling endpoints**: `submit-quiz` checks only truthiness; `submit-email` does `.includes('@')`; `submit-chs-application` uses a proper regex. The weakest sibling is usually the bug.
- **Date handling**: CLAUDE.md flags a known UTC timezone issue in client dashboard streaks (`todayStr()`). When inspecting date-bucketed logic, check whether dates are computed from UTC-anchored `Date.now() - i*86400000` vs locale-anchored, and whether Redis ZSET scores are derived consistently.
- **Re-parsing the same JSON**: `clients.js` PUT calls `JSON.parse(existing)` up to 3 times. Style nit, not a bug.

## False-positive patterns to avoid (seed)

- Vanilla `var`/`function` style: this codebase is intentionally pre-ES6 in API handlers for portability. Don't flag style modernization.
- Inline CSS in JS-rendered DOM (e.g., `quiz.js renderResults`): intentional for one-off animation hooks. Don't flag.
- Hardcoded Calendly URLs in JS: tier-specific slugs in CLAUDE.md look like they collide (Lifestyle's slug contains `growth`). Confirm with Thomas before reporting -- naming might be misleading but functional.
- IP-only rate limiting: corporate NAT could DoS each other, but this is an intentional simplicity tradeoff. Only flag if a much tighter limit blocks normal use.
- `crypto.timingSafeEqual` with empty buffers: only matters if env var is missing AND empty password reaches `verifyPassword`. The upstream `!password` truthy check in `dashboard/login.js` blocks the empty case. Don't flag.

## Areas explored

- `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`
- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`
- `api/dashboard/login.js`, `api/dashboard/clients.js`, `api/dashboard/client-portal.js` (partial)
- `api/client/login.js`, `api/client/reset-password.js`, `api/client/training-log.js`
- `api/cron/engagement-check.js`
- `js/quiz.js`, `js/main.js`
- Top-level HTML structure (index.html, pricing.html, chs.html, client-dashboard.html, thomas.html)

## Areas still unexplored (next focus rotations)

- `client-dashboard.html` inline JS (very large file -- inspect when functional focus next rotates)
- `thomas.html` inline JS (admin dashboard logic)
- `api/dashboard/{analytics, content, modules, pipeline, revenue, adspend}.js`
- `api/client/{daily-log, nutrition-log, five-four-five, activity-log, supplement-log, sidemenu, modules, push-*}.js`
- `sw.js` (service worker -- cache invalidation, push notification handler)
- Blog HTML files (23 files -- mostly static, low yield expected)
- CSS responsive breakpoints (visual focus)
