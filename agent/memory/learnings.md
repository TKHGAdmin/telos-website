# Bug Hunter — Accumulated Learnings

Living document. Append new entries at the bottom. Compress when over 2000 lines.

---

## 2026-04-26 — First run

This is the first run of the agent. No prior reports, no prior decisions.
Starting from a cold context. Goal of the first few runs: build a baseline
of what the codebase looks like and earn approvals on high-precision findings.

### Codebase landmarks

- **Plain HTML/CSS/JS, no build step.** Vercel serves static files + serverless
  functions in `api/`. No bundler, no TypeScript, no test suite to lean on.
- **All API handlers** are CommonJS `module.exports = async function handler`.
  They live in `api/`, `api/client/`, `api/dashboard/`, `api/cron/`.
- **Two auth surfaces**:
  - Admin (`api/lib/auth.js`): cookie `telos_dash_session`, payload is just
    `{expires}.{sig}` (2 parts), HMAC-SHA256.
  - Client (`api/lib/client-auth.js`): cookie `telos_client_session`, payload
    `{clientId}.{expires}.{sig}` (3 parts), PBKDF2 password hashing.
  Notable inconsistency: admin uses plain `!==` for sig compare, client uses
  `crypto.timingSafeEqual`. Flagged as a P3-level polish gap, not reported
  this run because the focus today was Functional.
- **Redis is Upstash REST**, accessed through `api/lib/redis.js`. No npm deps.
  Two functions: `redis(cmd, ...args)` and `redisPipeline(commands)`.
- **Email lookup pattern for clients**: `client_email:{normalizedEmail}` ->
  `clientId`. Created/destroyed by `api/dashboard/client-portal.js` (when
  portal toggled), checked by `api/dashboard/clients.js` POST and by
  `api/client/login.js`. The lookup is NOT cleaned up in
  `api/dashboard/clients.js` DELETE — see today's report.
- **Quiz lives in two places**: `index.html` (inline section) and
  `pricing.html` (overlay gate). Both share `js/quiz.js`. Pricing reveal is
  gated by `localStorage.telosQuizCompleted === 'true'`. The flag is set
  unconditionally in the submit handler — see today's report.

### False-positive patterns to avoid

(None yet — populate as decisions roll in.)

### Things investigated but NOT reported

- `api/lib/auth.js:27` — admin token signature compared with `!==` instead of
  `crypto.timingSafeEqual`. HMAC forgery is computationally infeasible without
  the secret, so the practical risk is near zero. Save for the Security focus
  rotation; reporting it under Functional would be off-topic.
- `sw.js:4` — cache name still `telos-v1`, never bumped. CLAUDE.md already
  flags this as known backlog work, so reporting it would be a duplicate.
- `api/cron/engagement-check.js:62` — message says "It's been N+ days" with
  N capped at 5 even when the real gap is longer. Cosmetic and the cron
  cadence makes it self-correcting; not worth a P3 today.
- `api/submit-chs-application.js:40` — stores raw `x-forwarded-for` (which
  may be a comma-separated proxy chain) into the application record. The
  rate-limit key uses the same string so behavior is consistent; just
  storage hygiene.
- `api/client/login.js` — no rate limit on login. Real concern, but lives
  squarely in the Security rotation.

### Open questions for future runs

- Does any code path actually call `api/client/login.js` from a non-web
  client (e.g. native app, Whop iframe)? If so, the cross-site cookie
  story matters more than I gave it credit for today.
- Where does the "view pricing" button get added on the pricing-page quiz
  results screen? `js/quiz.js:401` references `.quiz-view-pricing-btn` but
  I didn't trace its existence in `pricing.html`. Worth a Visual rotation
  pass.
