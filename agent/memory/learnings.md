# Bug Hunter Learnings

Accumulated knowledge across runs. Keep under 2000 lines; compress when exceeded.

## Codebase map (confirmed)

- Static site (HTML/CSS/JS) + Vercel serverless functions under `api/`.
- Redis (Upstash) is the only datastore. No SQL.
- Admin auth: HMAC-signed session cookie (`telos_dash_session`, 2-part token). lib: `api/lib/auth.js`.
- Client auth: HMAC-signed session cookie (`telos_client_session`, 3-part token `{clientId}.{expiry}.{sig}`). lib: `api/lib/client-auth.js`.
- All dashboard `api/dashboard/*` endpoints gate on `verifySession`.
- All client `api/client/*` endpoints gate on `verifyClientSession` and scope data by the authenticated `clientId`.

## Patterns worth checking on future runs

- **Redis key cleanup**: Several endpoints SET per-client keys (`client_email:*`, `client_dailylog:*`, `client_nutrition_log:*`, etc.) but deletion flows rarely DEL them. Check every DELETE handler vs. the full key list in CLAUDE.md.
- **Listener stacking**: `js/quiz.js` and likely other inline scripts attach listeners inside functions that can be called repeatedly. Search for `addEventListener` inside functions and check whether the target DOM element persists across calls.
- **Rate limiting by `x-forwarded-for`**: Several submit endpoints use the raw header, which can be a comma-joined list. Not a bug per se, but each unique string gets its own bucket.
- **Email HTML interpolation**: `reset-password.js` and `engagement-check.js` build HTML emails via string concatenation with user-controlled fields (`client.name`, `client.email`). Low-severity self-XSS but worth noting.

## False-positive patterns to avoid

- Known/documented limitations already listed in CLAUDE.md (e.g., Whop iframe + Safari cookies, todayStr() UTC timezone bug in client dashboard streaks, SW cache version bump backlog). Do NOT re-report these as new bugs - reference them if directly relevant.
- Style preferences (var vs const, inline CSS vs external) are NEVER bugs here - the codebase deliberately mixes styles.
- Existing quirks approved by the owner: self-contained dashboards skip main.js/style.css; tool pages have inline scripts; pricing page uses `p-` prefixed inline styles. These are all intentional per CLAUDE.md.

## Newly explored areas (2026-04-19)

- `api/lib/auth.js`, `api/lib/client-auth.js` - both clean.
- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js` - rate-limited, validate inputs, no obvious issues.
- `api/dashboard/clients.js` - **DELETE handler orphans `client_email:*` (P1, reported)**.
- `api/dashboard/client-portal.js` - portal-enable flow is correct but portal-disable does not clear password; minor.
- `api/dashboard/chs-applications.js` - clean.
- `api/client/login.js`, `api/client/daily-log.js`, `api/client/training-log.js`, `api/client/food-search.js`, `api/client/push-subscribe.js`, `api/client/reset-password.js` - mostly clean.
- `api/cron/engagement-check.js` - **no per-day dedup, sends daily reminder to every inactive-3+-days client (P2 UX)**. Defer to UX-focus day.
- `js/quiz.js` - **submit handler stacks on retake (P2, reported)**.

## Open questions / areas not yet explored

- `client-dashboard.html` (278 KB inline JS) - full flow audit pending.
- `thomas.html` (161 KB inline JS) - admin UI flow audit pending.
- Blog articles under `/blog/` (23 files) - meta-tag and link audit pending.
- `api/dashboard/upload-video.js`, `delete-video.js` - Blob interaction not yet reviewed.
- `api/client/modules.js`, `module.js`, `module-progress.js` - not yet reviewed.
- `sw.js` service worker - push notification + cache behavior not yet audited.
