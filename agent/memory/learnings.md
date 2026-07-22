# Telos Bug Hunter — Learnings

Living notes the agent uses to stay effective. Compress older entries when this file exceeds 2000 lines.

## Codebase Map (as of 2026-07-22)

- **No framework, no build step**: static HTML + `js/main.js` + serverless functions under `api/`.
- **Two auth systems**: `api/lib/auth.js` (admin, HMAC token 2 parts) and `api/lib/client-auth.js` (client, PBKDF2 + HMAC token 3 parts). Client tokens split on `.` and expect exactly 3 parts, so any dot in a `clientId` would break login.
- **Storage**: everything is Upstash Redis (`api/lib/redis.js`), no SQL. `client_email:{email}` is the canonical email→id lookup.
- **Dates**: Client dashboard uses `todayStr()` which is `toISOString().split('T')[0]` — this is UTC, not local. Server endpoints also use UTC for range queries. Already tracked in the CLAUDE.md P1-P3 backlog, do NOT re-report.
- **Rate limiting**: submit-quiz, submit-email, submit-chs-application all key on `x-forwarded-for` as-is. reset-password has none.

## Known false-positive patterns (do NOT report as bugs)

- **HTML in admin-authored strings** (e.g. `client.name.split(' ')[0]` in email templates). Admin-controlled input; low risk, would only self-XSS the admin.
- **`SameSite=None` on client cookie**: intentional for Whop iframe embedding. Documented in CLAUDE.md.
- **CORS not set on 4xx responses** in `/api/submit-*`: globally set in `vercel.json`, so responses get the header from Vercel regardless of what the handler does.
- **Different login error messages for enabled/disabled/no-password states**: leaks account existence, but the "contact your coach" wording is UX-critical. Skip unless asked to make login enumeration-resistant.
- **`todayStr()` UTC bug**: already tracked in CLAUDE.md P1-P3 backlog.
- **notify.js doesn't do RFC 8291 encryption**: code comments explicitly acknowledge this is placeholder / requires web-push. Only flag if push is claimed to work end-to-end.

## Areas covered so far

- `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`
- All public submit endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`)
- Client auth flow: `api/client/login.js`, `reset-password.js`, `push-subscribe.js`, `notify.js`, `daily-log.js`, `training-log.js`, `nutrition-log.js`, `food-search.js`, `send-email.js`
- Admin flow: `api/dashboard/clients.js`, portions of `client-portal.js`
- Cron: `engagement-check.js`
- Quiz gating: `js/quiz.js`, index.html quiz section, pricing.html quiz overlay
- `sw.js` service worker

## Areas NOT yet explored (candidates for future runs)

- Admin dashboards' front-end JS (thomas.html is 161KB inline)
- Client dashboard front-end (client-dashboard.html is 278KB — needs targeted grep, don't try full read)
- `api/dashboard/analytics.js`, `revenue.js`, `content.js`, `adspend.js`, `chs-applications.js`, `modules.js`, `upload-video.js`, `delete-video.js`
- All blog posts (23 files, mostly static)
- Mobile responsiveness (best done via live fetches on Visual/UX days)
- Image sizes / bundle audit (Performance days)
- `npm audit` on any real dependencies (Security days)

## Method notes

- The repo has no `package.json` deps to audit and no test suite — hunting is 100% code review.
- Use Grep for cross-file surveys, Read for suspected files. Only read enough of a big file to reach a verdict.
- When a bug touches both client and server, verify BOTH sides before reporting (e.g. the quiz gate needed both `type="button"` on the HTML and the JS handler to confirm).
