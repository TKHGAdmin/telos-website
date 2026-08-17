# Bug Hunter — Accumulated Learnings

Living document. Each daily run appends observations here and prunes obsolete ones. Keep under 2000 lines.

## Codebase orientation

- **Stack**: pure HTML/CSS/JS, no build. Vercel serverless functions in `api/`. Upstash Redis via REST for storage.
- **Two auth systems**: admin (`api/lib/auth.js`, cookie `telos_dash_session`, 2-part token) and client (`api/lib/client-auth.js`, cookie `telos_client_session`, 3-part token). Do NOT conflate them.
- **Sensitive endpoints**: everything under `api/dashboard/*` must call `verifySession` from `lib/auth`. Everything under `api/client/*` must call the client equivalent from `lib/client-auth`. Cron endpoints must check `CRON_SECRET`.
- **Public endpoints**: `submit-quiz.js`, `submit-email.js`, `submit-chs-application.js`. These should have some form of rate limiting (chs-applications explicitly does).

## Known limitations (per CLAUDE.md — do NOT re-report as bugs)

- Whop iframe login on Safari/iOS is a known cookie-blocking limitation. Not a bug.
- The bug crawl P1-P3 backlog from April 2026 is tracked in commit 7fa38ff. Known items:
  - Tool pages missing main.js
  - `.html` extensions in some internal links
  - `todayStr()` UTC timezone bug in client dashboard streaks
  - Service worker cache version bump needed
- These are known — do not re-report unless they've regressed further or a new manifestation appears.

## False-positive patterns to avoid

- **"Missing try/catch"** on already-guarded external calls is usually noise. Check whether the outer request handler already returns 500 on throw.
- **"Missing input validation"** on fields the UI constrains is only worth reporting if the endpoint is publicly reachable AND the missing check has a real downstream consequence (crash, injection, wrong data written).
- **"Redis key could collide"** on well-namespaced keys (e.g. `client_dailylog:{clientId}:{date}`) is not a real bug — the namespace prevents collisions.
- **"Could use const instead of let"** — style, not a bug. Never report.
- **"No unit tests"** — architectural, not a runtime bug. Never report.

## Patterns worth remembering

- Timing-safe password comparison is already present in admin auth (`crypto.timingSafeEqual` — verified in `api/lib/auth.js`). Don't re-report as missing.
- Client cookie uses `SameSite=None; Partitioned` INTENTIONALLY for Whop iframe support. Not a security bug.
- Charleston application endpoint has intentional rate limiting via `ratelimit:chs:{ip}` — verified pattern.

## Coverage log

Track which files have been inspected each day so we can rotate targets and avoid pounding the same ground.

| Date | Focus | Files/systems inspected |
|---|---|---|
| 2026-08-17 | functional | `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`, all of `api/dashboard/*`, all of `api/client/*`, `api/cron/*`, all three public `submit-*.js`, `vercel.json`, `manifest.json`, `sw.js` |
