# Telos Bug Hunter - Learnings

This file accumulates patterns the agent has noticed across runs.

## Codebase shape (first-pass notes)

- **No build step.** Pure HTML/CSS/JS + Vercel serverless functions. CommonJS in `api/`. No TypeScript, no test suite, no linters configured. Static analysis options are limited - bug hunts must be code-trace based.
- **API style.** All API endpoints follow the same handler shape: method gate, auth gate (`verifySession` for admin, `verifyClientSession` for client, `CRON_SECRET` bearer for cron), try/catch with `console.error` and 500. Validation is light - mostly presence checks + a few format regexes for dates.
- **Storage.** All persistence is Upstash Redis via REST. Heavy use of ZSETs for time-indexed lists (`clients_index`, `chs_applications_index`, `*_logs_index`) and JSON-string keys for records. Two-key pattern for some lookups (record + index, e.g. `client:{id}` + `client_email:{email}`).
- **No queue / no background jobs.** Bulk operations (send-all-emails, cron) run inline in the handler with sequential awaits. The 60s function maxDuration is the only ceiling.

## Known limitations called out in CLAUDE.md (do NOT flag as bugs)

- `todayStr()` UTC timezone bug in client dashboard streak calculations
- Whop iframe on Safari/iOS - third-party cookies blocked
- Service worker cache version bump pending
- Tool pages missing main.js, .html extensions in some internal links - documented P1-P3 backlog

## Patterns to watch

- **Dual-index integrity.** When code maintains a primary record + a lookup index (e.g. `client:{id}` + `client_email:{email}`), it's worth checking ALL the places that mutate each side. The duplicate-email-on-portal-enable issue is one example: the primary client.email field can be written without consulting the lookup, then a later operation populates the lookup based on the (possibly already-conflicting) primary field.
- **`new Date(now - i * 86400000).toISOString().split('T')[0]`** is a recurring pattern. It's UTC-based. Mostly fine for index keys (since the cron also runs in UTC), but produces off-by-one when displaying "today" to a US user near midnight ET. CLAUDE.md flags this as known.
- **`addEventListener` inside re-callable setup functions** is a recurring frontend smell. `setupLeadCapture` in `js/quiz.js` is one instance: each retake adds a fresh click handler without removing the previous one.
- **Streak calculations starting at d=0 (today)** silently break first thing in the morning before any user activity. Worth checking other streak/heatmap code for the same.

## False-positive patterns (skip)

- (none yet - will populate from denials)

## Areas explored

- `api/lib/{auth,client-auth,redis}.js`
- `api/lib/auth.js` admin session, `api/lib/client-auth.js` client session
- `api/client/{login,reset-password,daily-log,five-four-five,training-log,nutrition-log,activity-log,supplement-log,food-search,notify,send-email,modules,module-progress,push-subscribe}.js`
- `api/dashboard/{clients,client-portal,modules}.js`
- `api/cron/{engagement-check,weekly-summary}.js`
- `api/submit-{quiz,email,chs-application}.js`
- `js/{main,quiz,shop}.js`
- `vercel.json`

## Areas not yet explored

- `api/dashboard/{adspend,analytics,chs-applications,content,delete-video,emails,pipeline,revenue,stats,submissions,upload-video,login,logout}.js`
- `api/client/{me,mindset,nutrition-plan,resources,sidemenu,supplements,training-program,push-unsubscribe,module}.js`
- `client-dashboard.html` (278kb - very large, contains inline JS)
- `thomas.html` (161kb - admin dashboard, inline JS)
- `sw.js` service worker
- All blog pages
