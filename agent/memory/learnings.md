# Bug Hunter — Learnings

Accumulated knowledge from daily runs. Prune to 2000 lines max.

## 2026-07-26 — First run, infrastructure bootstrap + Functional pass

Bootstrapped the `agent/` scaffolding (memory + reports dirs) and `docs/BUG_REPORT_SCHEMA.md` because they did not exist yet. Ran a Functional-focus pass across `api/` (client + admin + cron endpoints), `api/lib/*`, and top-of-file HTML wiring.

### Repo shape learned
- Pure static site + Vercel serverless functions. No build step, no tests to run.
- Two auth surfaces: admin (`api/lib/auth.js`, cookie `telos_dash_session`) and client (`api/lib/client-auth.js`, cookie `telos_client_session`).
- All data in Upstash Redis via `api/lib/redis.js`. Keys are namespaced by concern (`client:{id}`, `client_email:{email}`, `client_<feature>:{id}[:date]`).
- Known-issue backlog acknowledged in `CLAUDE.md` under "Known Limitations" — do NOT re-report:
  - `todayStr()` UTC timezone bug in client dashboard streaks
  - Tool pages missing main.js
  - `.html` extensions in some internal links
  - SW cache version bump needed
  - Whop iframe cookies broken on Safari/iOS

### Patterns to watch
- **Delete endpoints leak Redis keys.** POST/PUT paths for clients set derived keys (`client_email:*`, per-date logs), but DELETE only removes the primary entity + index. This is a recurring shape — audit every future DELETE handler for orphaned derived keys.
- **Cron scripts compute date windows off `Date.now()` in UTC.** Any cron that runs early-morning ET and asks "today" of the client's data will see an empty slot for today. This will bite anywhere that uses `new Date(now - i*86400000).toISOString().split('T')[0]` and expects local-day semantics.
- **Rate limits are missing on auth-adjacent client endpoints.** `submit-quiz`, `submit-email`, `submit-chs-application` all rate-limit by IP. `client/login`, `client/reset-password`, `client/push-subscribe`, and most `client/*` mutation endpoints do NOT. Worth a dedicated security-day sweep.
- **Admin `verifyToken` uses `!==` on the HMAC signature** (`api/lib/auth.js:27`), but `client-auth.js` correctly uses `timingSafeEqual`. Divergent hardening. Save for Security day.
- **`notify.js` is a stub.** Writes are gated by VAPID keys being missing; if keys are ever set, the endpoint will silently break because Web Push encryption (RFC 8291) isn't implemented.

### False-positive traps to avoid
- Don't flag "no CSRF token" on admin endpoints — they use `SameSite=Strict` cookies which is the accepted mitigation here.
- Don't flag the `email_${source.replace('-', '_')}` key building in `submit-email.js` — the validSources allow-list makes injection impossible.
- Don't flag `Access-Control-Allow-Origin: *` on public submit endpoints — the site accepts submissions from its own origin only in practice, but wildcarding a POST-only endpoint that requires body + IP rate-limit is not itself a bug.

### Coverage notes
- **Read this run:** `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`, `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`, `api/dashboard/{clients,client-portal,pipeline,chs-applications}.js`, `api/client/{login,reset-password,daily-log,training-log,food-search,notify,push-subscribe,send-email}.js`, `api/cron/weekly-summary.js`, `sw.js`, chs.html snippets, client-dashboard.html `todayStr` region.
- **Not yet read:** `api/client/{me,mindset,resources,modules,module,module-progress,supplements,supplement-log,nutrition-{plan,log},activity-log,sidemenu,five-four-five,training-program,logout,push-unsubscribe}.js`, `api/dashboard/{stats,submissions,emails,revenue,content,adspend,analytics,modules,upload-video,delete-video,login,logout}.js`, `api/cron/engagement-check.js`, most of `client-dashboard.html`, `thomas.html`, `index.html`, `pricing.html`, `blog/*`. Rotate through these on future runs.
