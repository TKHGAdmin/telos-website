# Bug Hunter — Accumulated Learnings

This file is the agent's running notebook. Append new entries; compress when over 2000 lines.

## Codebase orientation

- Pure HTML/CSS/JS with Vercel serverless functions in `api/`. No build step, no test suite, no lockfile.
- Auth split in two: admin (`api/lib/auth.js`, cookie `telos_dash_session`, SameSite=Strict) and client (`api/lib/client-auth.js`, cookie `telos_client_session`, SameSite=None; Partitioned to support Whop iframe).
- All public-submission endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`) implement IP-based rate limiting via Redis INCR; **the login endpoints do not**.
- Client endpoints derive `clientId` from the session token (no IDOR surface seen on the audited endpoints).
- Admin endpoints take `clientId` from body/query — fine because they're admin-auth-gated.
- Cron endpoints (`api/cron/*`) require `Authorization: Bearer ${CRON_SECRET}` and fail-closed when `CRON_SECRET` is unset.
- All known DOM-injection in `client-dashboard.html` runs through `esc()` (HTML entity encoder via createTextNode), with two intentional exceptions: `drawerCustomContent.innerHTML = item.content` (coach-authored side-menu HTML) and `item.url` interpolation in `href=` (coach-authored URL — `javascript:` not blocked, but coach is trusted).

## Patterns to look for next time

- Whenever a new public endpoint is added: confirm it has IP rate-limit + bounded body parsing.
- Whenever a new client endpoint is added: confirm `clientId` comes from `verifyClientSession(req)` not the body.
- Whenever a new admin endpoint that takes a filename/path is added: confirm path traversal sanitization on the segment that becomes a storage key.
- Cookie attribute changes (SameSite, Partitioned) — re-evaluate CSRF surface, since client cookie is currently SameSite=None.

## Known false-positive patterns to skip

- `innerHTML` assignments where input passes through `esc()` — not XSS.
- `innerHTML` assignments of static strings or coach-authored content where coach is documented as a trusted admin role.
- Hardcoded `PROJECT_ID` in `api/dashboard/analytics.js` — Vercel project IDs are not secrets.
- Inconsistent error messages on login (`Invalid email or password` vs `Portal access not enabled` vs `Account is not active`) — minor user-enumeration leak but the coach onboards clients out-of-band, so attacker can't pivot from it; flag only if priority shifts.
- `delete` cleanup gaps (e.g., orphaned `client_email:` lookups after `clients.js` DELETE) — real but functional, not security. Report under functional focus, not security.

## Areas explored

- All `api/lib/*` (auth, client-auth, redis).
- All `api/dashboard/*` (full read on login/logout/clients/client-portal/upload-video/delete-video/analytics/chs-applications; spot-check on the rest).
- All `api/client/*` (full read on login/reset-password/notify/send-email/daily-log/activity-log/module/food-search; spot-check on the rest).
- Both `api/cron/*` files.
- Top-level `submit-*` endpoints.
- `client-dashboard.html` rendering paths for mindset/resources/sidemenu/training.
- `thomas.html` rendering paths for CHS applications and pipeline modal.
- `vercel.json`, `package.json`, `.gitignore`.
- `git log -p -S` for common secret prefixes — clean.

## Areas not yet explored

- `api/dashboard/{adspend, content, modules, pipeline, revenue, stats, submissions, emails}.js`.
- `api/client/{five-four-five, mindset, modules, module-progress, nutrition-log, nutrition-plan, push-subscribe, push-unsubscribe, resources, sidemenu, supplement-log, supplements, training-log, training-program, me, mindset, logout}.js`.
- `sw.js` — push notification + cache behavior.
- `js/main.js` and `js/quiz.js` — only spot-checked.
- All `/blog/*` HTML files.
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) inline scripts.
- `pricing.html` quiz gate logic.
