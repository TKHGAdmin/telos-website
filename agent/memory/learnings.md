# Bug Hunter — Learnings

Accumulated knowledge, false-positive patterns, and areas of the codebase explored.
Kept under 2000 lines. Older entries get compressed into summaries when the file grows.

---

## 2026-07-20 — First run (bootstrap)

**Codebase orientation.**
- Pure static HTML/CSS/JS + Vercel serverless functions. No framework, no build step.
- Two auth systems: admin (`api/lib/auth.js`, `telos_dash_session`, HMAC only over expiry, `SameSite=Strict`) and client (`api/lib/client-auth.js`, `telos_client_session`, HMAC over `{clientId}.{expiry}`, `SameSite=None; Partitioned` for Whop iframe).
- Redis is Upstash REST; `api/lib/redis.js` wraps both single commands and pipeline batches.
- Two cron jobs in `vercel.json`: `weekly-summary` (Mon 14:00 UTC) and `engagement-check` (daily 15:00 UTC). Both require `CRON_SECRET`.
- `CLAUDE.md` "Known Limitations" already documents a bug-crawl backlog — most notably `.html` extensions in internal links and the `todayStr()` UTC/timezone drift in client streak calculation. Treat these as **known**; don't re-file them without a new angle.

**Trust-boundary map.**
- `/api/submit-*` — public, rate-limited by IP (10/hr quiz+email, 5/hr chs). CORS wide open.
- `/api/dashboard/*` — admin cookie required (`verifySession`). Coach is the only user; treat inputs as internal but not adversarial.
- `/api/client/*` — client cookie required (`verifyClientSession`, returns `clientId`). Clients CAN act adversarially — they can post anything with a valid session.
- `/api/cron/*` — Bearer `CRON_SECRET` from Vercel infra.

**Redis key conventions (never confuse these on future runs):**
- `client:{id}` — canonical client record (JSON blob).
- `client_email:{normalizedEmail}` — reverse lookup, only populated when portal is enabled.
- `clients_index` — ZSET scored by `Date.now()` at create time.
- Per-client daily rows keyed as `client_<thing>:{clientId}:{YYYY-MM-DD}` and mirrored in a ZSET index.

**Recurring patterns worth watching:**
- `parseInt(x, 10) || null` / `parseInt(x, 10) || 0` idiom appears in several endpoints (`daily-log.js`, `training-log.js`, `nutrition-log.js`). This turns a legitimate `0` into the fallback. So far it's only used for `steps`, `weight`, `water` — fields where 0 is unusual but not impossible. Flag as bug only when the field could plausibly be zero and be meaningful.
- Date bucketing uses `new Date(now - d * 86400000).toISOString().split('T')[0]` in several places. This is UTC-based. Client-side, `client-dashboard.html` computes its own `todayStr()` — mismatches between the two are the source of the streak/heatmap drift already noted in CLAUDE.md.
- Rate-limit key = `x-forwarded-for || x-real-ip || 'unknown'`. Vercel populates these; spoofing at the edge is not a realistic vector. If x-forwarded-for is a chain like `client, proxy`, the whole string becomes the key. Not a bug on its own.

**False-positive patterns to avoid.**
- HTML injection via client name into Resend emails (`weekly-summary.js`, `engagement-check.js`, `reset-password.js`, `send-email.js`). The trust boundary is coach → coach's own clients; email clients don't execute JS. Report only if a public form ever writes to `client.name`.
- Length-branch in `verifyPassword` (`api/lib/auth.js:55`) leaks admin password length via timing. Single-user admin cookie; not worth flagging.
- CORS wildcard on `/api/submit-*`. Intentional — those endpoints are designed to be callable from any origin (embeds, tool pages).
- `href="index.html..."` on every non-index page. CLAUDE.md already lists this in the backlog. Don't refile.

**Areas explored on first run.**
- All `api/lib/*` (auth, client-auth, redis)
- All `api/submit-*.js`
- `api/cron/*` (both jobs)
- `api/client/{login,daily-log,training-log,nutrition-log,food-search,reset-password}.js`
- `api/dashboard/{login,clients,client-portal}.js`
- `js/quiz.js`, `sw.js`, root HTML files' nav/link structure

**Areas NOT yet explored — schedule for future runs.**
- Admin: `content.js`, `revenue.js`, `pipeline.js`, `analytics.js`, `upload-video.js`, `modules.js`, `adspend.js`, `emails.js`, `submissions.js`, `stats.js`, `chs-applications.js`.
- Client: `me.js`, `mindset.js`, `resources.js`, `nutrition-plan.js`, `five-four-five.js`, `training-program.js`, `sidemenu.js`, `modules.js`, `module.js`, `module-progress.js`, `notify.js`, `push-*.js`, `activity-log.js`, `supplements.js`, `supplement-log.js`.
- Client dashboard behavior (`client-dashboard.html`) — very large file, worth a dedicated visual/functional pass.
- `blog/*.html` — 23 articles, likely low bug-density but worth a link-check.
- `thomas.html` — 161KB admin dashboard, worth a security-focused pass on the token/session handling and any XSS sinks.
