# Telos Bug Hunter — Learnings

Accumulated knowledge from past runs. Compressed periodically. Read this first every day.

## Codebase shape (from first pass, 2026-07-15)

- Pure static HTML/CSS/JS on Vercel, no build step. Static pages under `/`, blog articles under `/blog/`, shared JS under `/js/`, serverless functions under `/api/` (subfoldered by auth surface: root = public, `client/` = client-session, `dashboard/` = admin-session, `cron/` = CRON_SECRET header).
- Data lives in Upstash Redis via the wrapper in `api/lib/redis.js`. Keys are underscore-delimited, per-client prefixed. There is NO relational schema; deletes must fan out to every related key by hand.
- Two separate cookie namespaces: `telos_dash_session` (admin, SameSite=Strict) and `telos_client_session` (client, SameSite=None+Partitioned for Whop iframes).
- `api/lib/auth.js` verifies HMAC-signed tokens; `api/lib/client-auth.js` uses PBKDF2-100k + timing-safe compare for client passwords. Both use `SESSION_SECRET`.
- `js/main.js` handles the whole shared UI layer (nav, scroll animations, tilt, cursor glow, magnetic buttons, FAQ, ripple). Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained and do NOT load main.js.
- Client dashboard state lives in one large `S` object in `client-dashboard.html`; `todayStr()` is UTC-based (documented in CLAUDE.md as a known backlog issue).

## Patterns to remember

- **Rate limiting**: All three public endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`) use `req.headers['x-forwarded-for']` verbatim as the bucket key. On Vercel, this header can be prefixed by the client, so each spoofed prefix mints a fresh bucket. If we ever add another rate-limited endpoint, use `(req.headers['x-forwarded-for'] || '').split(',').pop().trim()` — the rightmost entry is Vercel's appended real client IP.
- **Redis delete surface for clients**: A client owns ~15 keys (`client_email:`, `client_dailylog:`, `client_dailylogs_index:`, `client_nutrition_plan:`, `client_nutrition_log:`, `client_nutrition_logs_index:`, `client_mindset:`, `client_resources:`, `client_545_goals:`, `client_545_routine:`, `client_545_daily:`, `client_545_index:`, `client_training_program:`, `client_training_log:`, `client_training_logs_index:`, `client_sidemenu:`, `client_supplement_plan:`, `client_supplement_log:`, `client_supplement_logs_index:`, `client_activity_log:`, `client_activity_logs_index:`). `clients.js DELETE` cleans up only two of them.
- **Input caps are inconsistent**: `five-four-five.js` and `training-log.js` cap free-text and array lengths. `daily-log.js` and `nutrition-log.js` do not. Any new writer endpoint should cap on the way in.
- **Cron time-of-day matters**: Weekly-summary runs at 14:00 UTC (~9am ET Monday). If a calculation counts "today", most clients haven't logged yet. Always start streak/last-log logic at `d=1` (yesterday) or higher for cron-side rollups.
- **Shopify Storefront token in `js/shop.js` is public-safe**. Don't flag it as an exposed secret.

## Known backlog (documented in CLAUDE.md — do not re-report unless regressed)

- Tool pages missing `main.js`
- `.html` extensions in some internal links
- `todayStr()` UTC timezone bug in client dashboard streaks
- Service worker cache version bump needed periodically
- Whop iframe login broken on Safari/iOS (third-party cookie block)

## False-positive templates to avoid

- **Missing `rel="noopener noreferrer"` on `target="_blank"`**: Modern browsers add `noopener` implicitly for `target="_blank"` since ~2020. Not worth flagging on a marketing site.
- **Timing side-channel on user-existence in login**: Login endpoints run PBKDF2 only when the client_email lookup returns something. This is a known and typically-accepted pattern; not worth reporting unless a specific abuse case surfaces.
- **`descriptionHtml` from Shopify rendered raw in shop.js**: Shopify admin is the trusted source. Not XSS unless the admin account is compromised, which is out of scope.
