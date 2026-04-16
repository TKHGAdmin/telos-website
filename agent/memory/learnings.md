# Bug Hunter Learnings

Accumulated knowledge across runs. Append new entries to the top. Keep this file under 2000 lines.

---

## 2026-04-16 - First run findings + map of the client-email lookup

- The client portal's only source of truth for email uniqueness is the Redis key `client_email:{normalizedEmail}`. This key is written in `api/dashboard/client-portal.js` POST and `api/dashboard/clients.js` PUT. It is read in `api/dashboard/clients.js` POST (uniqueness gate), `api/client/login.js` (login resolution), and `api/client/reset-password.js`. Three observations worth carrying forward:
  - Any write path that sets `client.email` without also touching this key can create phantom collisions (file BUG-20260416-01).
  - Any delete path that removes a client record without also removing this key creates orphan lookups (file BUG-20260416-02).
  - `client-portal.js:115` does `SET` without a CAS - the next bug-hunter pass on this area should check whether an atomic `SETNX` or a pre-read guard has landed.
- Next run's first action on any "email / login / client deletion" story: grep `client_email:` across `api/**/*.js` and cross-check that every write/delete pairs cleanly.
- Pattern noticed across the `api/client/*.js` endpoints: POST handlers validate date with `/^\d{4}-\d{2}-\d{2}$/` but then call `new Date(body.date).getTime()` for the ZADD score. That produces a UTC-midnight epoch, which is fine for ordering but is why the `todayStr()` UTC-vs-local-date bug mentioned in CLAUDE.md's backlog exists. Don't re-report that specific streak bug - it's already known.
- `js/quiz.js` minimum pillar score is 8 (1 point minimum x 8 questions), so the `countInterval = countDuration / totalScore` division never divides by zero. Confirmed safe.

## 2026-04-16 - First run, baseline observations

- Codebase is pure HTML/CSS/JS + Vercel serverless functions. No build step, no TypeScript, no test suite. That means `tsc --noEmit` / `npm test` will not be useful - all checking is static grep + code trace + live-site fetch.
- `package.json` is near-empty - there is no lockfile or dependency set to audit with `npm audit` on functional/security runs. API functions use Upstash via a bespoke REST wrapper (`api/lib/redis.js`) rather than npm deps.
- Two auth systems: admin (`telos_dash_session`, 2-part token, `SameSite=Strict`) and client (`telos_client_session`, 3-part token, `SameSite=None; Partitioned`). Do not confuse the two when reviewing `verifySession` calls.
- CLAUDE.md is the authoritative architecture doc. Known-deferred items listed under "Known Limitations" and the "P1-P3 backlog" should not be re-reported: tool pages missing main.js, `.html` extensions in some internal links, `todayStr()` UTC timezone bug in client dashboard streaks, SW cache version bump needed. Reference commit `7fa38ff`.
- Quiz / email / Charleston submit endpoints use IP-based rate limiting with `x-forwarded-for`. The default fallback key `'unknown'` means attackers behind anonymizing proxies share a quota - that is intentional, not a bug.
- Rate-limit counters use Redis `INCR` then `EXPIRE` only when `count === 1`. If the `EXPIRE` call fails silently, the key could live forever - but that is a hardening nit, not a bug worth filing unless reproducible.

### False-positive patterns to avoid

- Missing `main.js` on tool pages: already on backlog (commit 7fa38ff plan).
- `.html` extensions in internal links: already on backlog.
- Missing alt text on decorative images: only report if the image conveys meaning.
- Redis calls without explicit retry logic: the `redis.js` wrapper is intentionally minimal.
- Any "code could be more DRY" observation: out of scope per the hard rules.
