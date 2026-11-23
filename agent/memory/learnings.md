# Bug Hunter — Accumulated Learnings

This file grows over time. Keep it under 2000 lines; compress older entries when it exceeds that.

## Repo shape (established 2026-11-23)

- Pure HTML/CSS/JS front-end, no build step. Vercel-hosted serverless functions in `api/`.
- Admin surface: `thomas.html` + `api/dashboard/*`. Admin auth is a single shared password with an HMAC-signed cookie (`telos_dash_session`, SameSite=Strict). Lives in `api/lib/auth.js`.
- Client surface: `client-dashboard.html` + `api/client/*`. Per-client PBKDF2-hashed password, HMAC-signed cookie (`telos_client_session`, SameSite=None; Partitioned for Whop iframe). Lives in `api/lib/client-auth.js`.
- Cron endpoints in `api/cron/*` require `Bearer ${CRON_SECRET}`.
- Three public write endpoints: `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`. All rate-limited by IP in Redis.
- Data store: Upstash Redis via REST (`api/lib/redis.js`). No SQL => no SQL injection surface.

## Patterns observed

- Admin and client auth libraries have divergent crypto hygiene. Client auth uses `crypto.timingSafeEqual` in both the signature verify and the password check. Admin auth uses plain `!==` for signature compare and does an early-return length check in `verifyPassword`. Worth watching for drift.
- All three public write endpoints use the same rate-limit pattern and all three share the same `req.headers['x-forwarded-for']`-as-key weakness. If one is fixed, grep for the other two.
- Client-portal API has consistent admin-auth gating. Client API consistently calls `verifyClientSession` and scopes queries by the returned `clientId` — no obvious IDOR on the client side (endpoints never accept `clientId` from the body/query, they derive it from the session cookie).
- `innerHTML` is used heavily in `js/shop.js` with Shopify-sourced strings. Mostly safe since Shopify data is admin-controlled, but product image `src` is interpolated into an `onclick="switchProductImage(this, '…')"` attribute without escaping. Theoretical XSS if a Shopify image URL ever contains a single quote. Not reported — low practical risk given Shopify's CDN URLs.

## False-positive patterns to avoid

(empty — populate as Thomas denies findings)

## Known limitations noted in CLAUDE.md

- Whop iframe cookies on Safari/iOS do not work. Don't re-flag.
- Bug-crawl P1-P3 backlog from April 2026 exists in git history (commit 7fa38ff plan file). Before reporting anything, grep that era to avoid duplicates. Known items still open: tool pages missing main.js, `.html` extensions in internal links, `todayStr()` UTC timezone bug in client dashboard streaks, SW cache version bump.

## Infrastructure gaps on first run (2026-11-23)

- `agent/memory/`, `agent/reports/`, and `docs/BUG_REPORT_SCHEMA.md` were missing. Scaffold was bootstrapped on first run. Using `agent/memory/schema.md` as the working schema until the canonical one lands. Thomas was notified.
- `run.py` orchestrator mentioned in the system prompt is not present. The scheduled task currently triggers the agent directly; email emission has to happen inside the run (via push notification) until `run.py` exists.
