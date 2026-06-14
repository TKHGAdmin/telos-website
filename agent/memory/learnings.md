# Bug Hunter Learnings

Long-running notes the agent writes to itself across runs. Read this at the start of every run.

---

## 2026-06-14 (Functional, first run)

### Codebase shape
- Plain HTML/CSS/JS site. No framework, no build step, no test suite. Static analysis is what's available; no `tsc`, no `vitest`. `npm test` is not configured.
- API surface is Vercel serverless functions under `api/`. All shared logic is in `api/lib/` (`auth.js`, `client-auth.js`, `redis.js`).
- Redis is Upstash via REST. `redis(...)` and `redisPipeline(...)` are the only two primitives. No ORM, no schema validation.
- Two cookie auth schemes coexist: admin (`telos_dash_session`, 2-part token, `SameSite=Strict`) and client (`telos_client_session`, 3-part token, `SameSite=None; Partitioned`). Client side uses `crypto.timingSafeEqual`; admin side uses bare `!==` on the HMAC.

### Patterns to scan for next time
- **Rate-limit keying off `x-forwarded-for`** - the entire string is used as the bucket. Spoofable by any client (XFF is left-most-wins for client, right-most is the trustworthy peer on Vercel). Flagged in BUG-2026-06-14-01 across three submit endpoints. Worth re-checking any new public POST endpoint.
- **Orphaned Redis lookup keys on entity delete** - the admin DELETE on `clients.js` is the only delete handler audited so far; it leaks `client_email:{normalizedEmail}`. Likely the same pattern repeats wherever a secondary index is written elsewhere (e.g. `client_dailylogs_index`, `client_supplement_logs_index`, etc., on client deletion). Worth a focused pass next Functional rotation.
- **Email HTML built by string concat with no escaping** - reset-password.js, weekly-summary.js, engagement-check.js all interpolate `client.name` and other fields directly into HTML. Names come from the admin, so risk is theoretical; flag only if a user-controlled field gets included.
- **Streak/date logic** - weekly-summary.js streak loop already has a bug at index 0. Client dashboard streak logic in client-dashboard.html has a known UTC bug (per CLAUDE.md backlog). Date code is consistently suspect across this codebase.

### Known false-positive shapes (don't report these again)
- "Bare HMAC string compare in admin auth.js" - it's theoretically timing-attackable, but the admin password is the only secret and lengths leak anyway via `verifyPassword`. Realistic impact on a single-tenant small-business dashboard is near zero. Flag only as P3 in a Security-focus run with an actual attack path.
- "`limit=10000` on `/api/client/training-log?mode=recent`" - unbounded but only returns the caller's own logs. Self-DoS at worst.
- "Service worker caches everything forever" - bumping `CACHE_NAME` is the documented mitigation. Not a bug, just a deploy step.
- "Calendly URLs duplicated across files" - intentional per CLAUDE.md (per-tier links). Not a dedup target.

### Files I touched / read this run
- `api/lib/auth.js`, `api/lib/client-auth.js`
- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`
- `api/dashboard/clients.js`, `api/dashboard/client-portal.js`
- `api/client/login.js`, `api/client/reset-password.js`, `api/client/daily-log.js`, `api/client/training-log.js`, `api/client/food-search.js`
- `api/cron/weekly-summary.js`, `api/cron/engagement-check.js`
- `js/quiz.js`, `sw.js`
- `index.html` (headers, nav, IG links), `chs.html` (form submit)

### Areas not yet explored
- `client-dashboard.html` internals (278KB inlined - needs targeted grep, not full read).
- `thomas.html` internals (161KB inlined).
- `js/main.js` (nav, scroll animations, tilt, cursor, counters).
- `api/dashboard/analytics.js`, `revenue.js`, `pipeline.js`, `content.js`, `modules.js`, `upload-video.js`, `delete-video.js`.
- All 23 blog posts - likely repetitive but worth a sweep for dead internal links.
- The Charleston flow end-to-end (submit through admin review).

### Tooling notes for future runs
- `npm test` is not wired up. Don't try to run it.
- `npx serve -l 3000 .` works for live HTML inspection. Do NOT use `-s` (SPA mode breaks routing per CLAUDE.md).
- No Lighthouse, no axe-core, no ESLint config detected. Performance/Visual focus days will need to use ad-hoc grep + manual inspection.
- The repo has no `tests/` directory and no CI. There is no safety net for refactors - findings should be tight on root cause and the suggested fix should be small.
