# Telos Bug Hunter - Learnings

This file is the agent's accumulated knowledge across runs. Keep under 2000 lines.

## Codebase mental model

- **No build step.** Pure HTML/CSS/JS + Vercel Serverless Functions. There is no compiler catching field-name typos, no Prettier/eslint pass, no TypeScript. This means string-keyed mismatches between the dashboard UI and the API (snake_case vs camelCase) are invisible until a user notices "the date column is blank." Always cross-check field names when an admin form writes to an API and another part of the UI reads it back.
- **Two HTML monoliths.** `thomas.html` (~160KB, admin dashboard) and `client-dashboard.html` (~278KB, client PWA) are self-contained - all CSS and JS inline, never loading `js/main.js`. When a bug is "in the dashboard," it lives in one of these files.
- **Data lives in Upstash Redis** via a REST shim (`api/lib/redis.js`). All endpoints await `redis(cmd, ...args)`. Pipelining is supported via `redisPipeline`.
- **Two cookie auth systems** sharing `SESSION_SECRET`:
  - `telos_dash_session` (admin, `api/lib/auth.js`, 2-part token, `SameSite=Strict`)
  - `telos_client_session` (client, `api/lib/client-auth.js`, 3-part token with embedded clientId, `SameSite=None; Partitioned` for Whop iframe support)
  - Note: admin token signature uses plain `!==` compare (auth.js:27); client token uses `crypto.timingSafeEqual` (client-auth.js:49). Inconsistency worth flagging on a Security run.
- **Field-naming convention drift.** APIs uniformly use camelCase in stored records. The admin dashboard `thomas.html` uses **snake_case** for client/lead/submission/email fields in many places. Confirmed mismatches as of 2026-06-10: `monthly_rate`, `start_date`, `created_at`, `updated_at`, `follow_up_date`, `score` (vs `totalScore`/`quizScore`). The client dashboard `client-dashboard.html` does not seem to have this same disease - it mostly uses camelCase that matches the API.

## Hunting tactics that worked

- Grep for `snake_case` vs `camelCase` of the same logical field across the repo. E.g. `grep -n 'monthly_rate\|monthlyRate' thomas.html api/dashboard/clients.js`. Mismatches surface immediately.
- For each API endpoint, look at what `body.xxx` fields are *read* on POST/PUT, then grep thomas.html for what it *sends*. The diff is bugs.
- For each table render in thomas.html (any `forEach` that builds `<tr>`s), check every property accessor against the API response shape.

## False-positive patterns to avoid

- (none yet - decisions.jsonl is empty on first run)

## Known issues - do NOT re-report

Per CLAUDE.md:
- Whop iframe on Safari/iOS - third-party cookies blocked, no fix planned without token-based auth.
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) missing `js/main.js` and duplicating hamburger handlers.
- `.html` extensions in some internal links (e.g. `chs.html` footer).
- `todayStr()` UTC timezone bug in client dashboard streaks (`new Date().toISOString().split('T')[0]` uses UTC, not local).
- Service worker cache version bump needed.
- CSS `?v=` cache busting inconsistency (some files at `?v=2`, CLAUDE.md says current is `?v=16`).

## Conventions reaffirmed by inspection

- All public marketing pages SHOULD load `js/main.js` (handles nav, hamburger, scroll). Tool pages currently don't (known issue).
- Admin endpoints all gate on `verifySession(req)`. Client endpoints gate on `verifyClientSession(req)` - which returns the clientId string, not a full client record. Endpoints do NOT recheck `client.status` or `client.portalEnabled` after login.
- Rate limits live in Redis under `ratelimit:{namespace}:{ip}` keys.
- All client log endpoints (`daily-log`, `nutrition-log`, `training-log`, `activity-log`, `545`) follow the same shape: `client_xxx:{clientId}:{YYYY-MM-DD}` key, mirrored into a `client_xxx_logs_index:{clientId}` zset scored by epoch.

## Open questions for future runs

- Does the client dashboard correctly handle the case where the coach changes their email mid-session? (PUT clients.js:121 only migrates the email lookup if portalEnabled is true - if a coach changes an inactive client's email, then later enables portal, the old normalized email may still resolve to nothing.)
- Are there XSS vectors via the dashboard's many `innerHTML` writes of Redis-stored data? Worth a Security-run pass.
- The Open Food Facts API is unauthenticated and unrate-limited from the Telos side - is `food-search.js` a DOS amplification vector? Worth a Security-run pass.
