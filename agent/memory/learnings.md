# Bug Hunter Learnings

This file accumulates patterns, false-positive traps, and codebase notes across runs. Keep entries dated. Compress old entries into the "Compressed history" section when this file passes ~2000 lines.

---

## Codebase notes (bootstrap: 2026-08-27)

- **No framework, no build step.** Pure HTML/CSS/JS + Vercel serverless functions. No `dist/`, no bundler artifacts. Perf hunts should measure page weight and network waterfalls, not bundle size.
- **Two auth systems, subtly different.**
  - `api/lib/auth.js` = admin dashboard sessions. HMAC signed cookie, `SameSite=Strict`. Password check is timing-safe. **Token signature comparison is NOT timing-safe** (`!==` on line 27).
  - `api/lib/client-auth.js` = client portal sessions. HMAC signed cookie, `SameSite=None; Partitioned` (for Whop iframe). Uses `crypto.timingSafeEqual` for both password AND signature. This is the correct pattern.
- **Redis layout is heavily key-based.** No secondary indexes. When a top-level object is deleted, its lookup keys (e.g. `client_email:{email}`) and its per-day log keys are usually orphaned - this is a recurring class of bug worth checking for every DELETE handler.
- **UTC vs local-date bug is already known and tracked.** CLAUDE.md flags "todayStr() UTC timezone bug in client dashboard streaks" as a P1-P3 backlog item. Do NOT re-report anything that reduces to "the server uses UTC dates and the client uses local dates."
- **All cron endpoints check `authorization: Bearer $CRON_SECRET`.** Fail-closed if `CRON_SECRET` is missing (they return 401). This is correct.
- **`req.body`** is auto-parsed by Vercel when `Content-Type: application/json` is set. If missing, `req.body` is `undefined` and property access throws — most handlers catch this in try/catch and return 500, but a few (e.g. `submit-chs-application.js`) short-circuit with `req.body || {}` which is safer.
- **Rate limiting uses `x-forwarded-for` verbatim.** On Vercel this header is appended by the edge, so the value the code sees may include a user-controlled prefix. This is an easy rate-limit bypass surface, but the impact is low-severity (form spam only). Not currently reported.

## False-positive traps (updated as denials come in)

- **UTC date bugs**: known/tracked; do not report.
- **Service worker cache-version bump**: known/tracked; do not report.
- **Tool pages missing `main.js`**: known/tracked; do not report.
- **`.html` extensions in internal links**: known/tracked; do not report.
- **Whop iframe/Safari cookie behavior**: known limitation; do not report.
- **Push notifications missing full VAPID/RFC 8291 encryption**: `api/client/notify.js` explicitly notes this is a simplified implementation. Do not report until real push delivery is being targeted.
- **`send-email.js` interpolates `client.name` and admin-authored HTML unescaped**: the author is the admin, so this is self-XSS at worst, not a real vulnerability.
- **`api/dashboard/analytics.js` timeout/error resolve() calls after end()**: promises are idempotent, so a second resolve is a no-op. Not a bug.

## Recurring bug classes to hunt for

- **DELETE handler orphan cleanup** (Redis keys, lookup indexes, ZSETs, subordinate data).
- **Event listener accumulator** (functions that re-attach `addEventListener` on retake/reopen without removing).
- **Cron dry-run vs live semantics** (silent skips when API keys are missing).
- **`portalEnabled` state transitions** (email lookup lifecycle across enable/disable/email-change).
- **Auth cookie invalidation on password reset** (there is no server-side session revocation; sessions live 7 days regardless).

## Files explored this run

- `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`
- `api/client/{login,reset-password,daily-log,five-four-five,food-search,training-log,notify,send-email,nutrition-log,supplement-log,activity-log,push-subscribe}.js`
- `api/dashboard/{clients,pipeline,client-portal,analytics,adspend}.js`
- `api/cron/{weekly-summary,engagement-check}.js`
- `api/submit-quiz.js`, `api/submit-chs-application.js`
- `js/main.js`, `js/quiz.js`
- `sw.js`

Not yet explored: full `client-dashboard.html`, full `thomas.html`, blog HTML files, `resources.html`, `chs.html`, `pricing.html`, `hyrox-predictor.html`, `protein-calculator.html`, `modules.js`, `module.js`, `module-progress.js`, `revenue.js`, `content.js`, `stats.js`, `submissions.js`, `emails.js`, `chs-applications.js`, `upload-video.js`, `delete-video.js`.
