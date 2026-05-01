# Telos Bug Hunter - Learnings

A running ledger of patterns observed, false-positive traps to avoid, and codebase areas explored.
Compress into a summary if this file exceeds 2000 lines.

## Codebase orientation (2026-05-01, first run)

- Stack: pure HTML/CSS/JS, no build step, Vercel serverless functions, Upstash Redis.
- Auth split: `api/lib/auth.js` (admin, `telos_dash_session`, SameSite=Strict) vs `api/lib/client-auth.js` (client, `telos_client_session`, SameSite=None+Partitioned for Whop iframe).
- Both auth modules sign cookies with `SESSION_SECRET` HMAC-SHA256.
- Redis access is via `redis(cmd, ...args)` and `redisPipeline(cmds)` - tiny REST wrapper, no npm dep.
- All admin endpoints under `api/dashboard/*` open with `if (!verifySession(req)) return 401`.
- All client endpoints under `api/client/*` open with `verifyClientSession(req)` and use the returned `clientId` directly without re-validating that the client still exists / is active / has portal enabled.
- Front-end: `js/main.js` is loaded on public pages; `thomas.html` and `client-dashboard.html` are self-contained (inline CSS/JS, no main.js).
- `js/quiz.js` is loaded by both `index.html` (inline section) and `pricing.html` (overlay) and uses `document.querySelector('.quiz-overlay')` to detect context.

## Patterns to look for next time

- **Stale-state auth**: any admin "disable" or "delete" action that does not revoke active client cookies. Worth checking other surfaces (push subscriptions, password reset tokens, etc.) when admin mutates a client.
- **Index/lookup divergence**: Redis often has parallel keys that must be kept in sync (e.g. `client_email:{email}` <-> `client:{id}`). Look for write paths that update one but not the other, especially DELETE paths.
- **Cron idempotency**: cron emails that re-fire daily without a per-recipient cooldown key.
- **Auto-advance UI without click guards**: any `setTimeout`-based progression in quizzes/wizards is a candidate for double-tap inflation bugs.
- **Form submit handlers without disable-on-submit**: similar pattern, can produce duplicate Redis writes.
- **Silent fail on `fetch().catch(()=>{})`**: quiz.js, submit-email, submit-chs all use this. Errors are swallowed - operationally fine, but keep in mind that a failure mode here is invisible to users.

## False-positive traps to avoid

- HMAC `!==` comparison: not exploitable when payload is server-issued; do not flag unless secret-bearing.
- `form.name.value` referencing a child input named `name`: HTMLFormElement uses `[OverrideBuiltins]`, so this works in all major browsers.
- `client.name` interpolated into admin-only HTML emails: admin-controlled, out of threat model.
- UTC date arithmetic in client dashboard streaks: already documented in CLAUDE.md known limitations - not a fresh bug.
- SW cache version bump: documented in CLAUDE.md known limitations.

## Areas explored

- `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`
- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`
- `api/client/login.js`, `me.js`, `daily-log.js`, `training-log.js`, `activity-log.js`, `food-search.js`, `notify.js`, `reset-password.js`
- `api/dashboard/login.js`, `clients.js`, `client-portal.js`, `pipeline.js`, `revenue.js`, `chs-applications.js`, `upload-video.js`
- `api/cron/weekly-summary.js`, `api/cron/engagement-check.js`
- `js/quiz.js`, `js/main.js`, `sw.js`
- `chs.html` (form submission flow)

## Areas NOT yet explored (queue for future runs)

- `client-dashboard.html` (278 KB inline JS)
- `thomas.html` (admin SPA, 161 KB inline JS)
- `pricing.html` quiz overlay logic
- All blog articles - low priority, mostly static
- `api/dashboard/analytics.js`, `content.js`, `adspend.js`, `modules.js`, `delete-video.js`, `stats.js`, `submissions.js`, `emails.js`
- `api/client/mindset.js`, `nutrition-log.js`, `nutrition-plan.js`, `five-four-five.js`, `modules.js`, `module.js`, `module-progress.js`, `push-subscribe.js`, `push-unsubscribe.js`, `resources.js`, `send-email.js`, `sidemenu.js`, `supplements.js`, `supplement-log.js`, `training-program.js`, `logout.js`
- Live site behavior (no fetches yet)
