# Telos Bug Hunter - Accumulated Learnings

This file is the agent's long-term memory. Append, don't rewrite.
Keep under 2000 lines; compress older entries when needed.

---

## Codebase map (verified 2026-06-09)

- Pure HTML/CSS/JS, no build step. Vercel static + serverless functions.
- API layer under `api/`, split into public submit endpoints, `cron/`,
  `client/` (client portal, gated by `verifyClientSession`), and
  `dashboard/` (admin, gated by `verifySession`).
- Auth: `api/lib/auth.js` (admin, HMAC + timing-safe password) and
  `api/lib/client-auth.js` (client, PBKDF2 + HMAC token). Note: admin
  `verifyToken` uses plain `!==` on the signature (not timing-safe);
  client `verifyClientToken` correctly uses `crypto.timingSafeEqual`.
- Redis access via Upstash REST in `api/lib/redis.js`. Both `redis()` and
  `redisPipeline()` are used; pipeline returns `[{result}]` not raw values.
- Lead capture flow: HTML form -> `js/quiz.js` -> `POST /api/submit-quiz`
  -> Redis ZADD `quiz_submissions`. Failures are swallowed client-side.
- Cron jobs: `engagement-check` (daily) and `weekly-summary` (Mon 14 UTC).
  Both gated by `Bearer ${CRON_SECRET}` and skip cleanly if RESEND_API_KEY
  is not set.

## Patterns to watch for

- **HTML form buttons mis-typed**: `<button type="button">` inside a
  `<form>` bypasses HTML5 `required` validation. Found in the quiz lead
  capture (index.html + pricing.html). Protein-calculator and Hyrox use
  `type="submit"` correctly - pattern is isolated to the quiz.
- **Cron de-duplication**: Daily crons that send emails need either a
  "last-sent" tracker per recipient or a schedule rule (e.g. only Mondays)
  to avoid spamming. The engagement-check cron currently has neither.
- **UTC date math for "today"**: Multiple endpoints use
  `new Date().toISOString().split('T')[0]` for today's date - this is UTC,
  not the user's local date. Already documented in CLAUDE.md as a known
  P1 backlog item; do not re-flag.
- **req.body destructuring on undefined**: Several endpoints do
  `var body = req.body; if (!body.email)` - if body is undefined (wrong
  content-type), this throws and falls into the 500 catch. Not a bug per
  se, but worth noting if a 500 is reported.
- **x-forwarded-for as full string**: Used directly as rate-limit key in
  submit-quiz / submit-email / submit-chs-application. XFF can be a CSV;
  attackers behind proxies could spoof it to evade rate limiting. Low
  practical risk given Vercel terminates the edge.

## False-positive patterns (don't re-report)

- The UTC `todayStr()` timezone bug in the client dashboard streak
  calculation is already in the P1-P3 backlog (CLAUDE.md). Re-flagging
  would be duplicate.
- The SW cache name bump is also in the backlog.
- The `web-push` library not being installed (notify.js has a TODO)
  is intentional - it gracefully degrades when VAPID keys are absent.
- `client.name` interpolated into Resend HTML emails without escaping is
  a self-XSS at most (the recipient is the named client, and the coach
  sets the name). Skip unless you find a path where a third party can
  set the name.

## Areas explored on this run

- `api/lib/{auth,client-auth,redis}.js`
- `api/{submit-quiz,submit-email,submit-chs-application}.js`
- `api/client/{login,reset-password,daily-log,training-log,nutrition-log,activity-log,food-search,notify,me}.js`
- `api/dashboard/{clients,client-portal}.js`
- `api/cron/{engagement-check,weekly-summary}.js`
- `js/quiz.js` + lead capture HTML in `index.html` and `pricing.html`
- `vercel.json` (cron schedules, CORS)

## Not yet explored (for future runs)

- `client-dashboard.html` interior logic (278kB file - score calc, FAB,
  food modal, training timer)
- `thomas.html` interior logic (161kB)
- All `/blog/` articles (23 files - check for broken links, missing
  metadata, mobile layout)
- `/api/dashboard/{revenue,content,adspend,modules,analytics}.js`
- Service worker push handler
- Visual/responsive behavior of the actual rendered pages
