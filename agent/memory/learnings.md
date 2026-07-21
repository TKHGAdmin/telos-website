# Bug Hunter Learnings

Rolling notebook of patterns, false positives, and codebase quirks.
Keep under 2000 lines. Compress older entries into summaries when needed.

---

## Codebase shape (as of 2026-07-21)

- Pure HTML/CSS/JS static site + Vercel serverless functions in `api/`.
- Storage is Upstash Redis via a tiny REST wrapper in `api/lib/redis.js`.
- Two auth systems:
  - **Admin** (`api/lib/auth.js`): HMAC-signed cookie `telos_dash_session`, single
    password from `DASHBOARD_PASSWORD` env, timing-safe password compare.
  - **Client** (`api/lib/client-auth.js`): PBKDF2 password hashing, HMAC-signed
    3-part token `{clientId}.{expiry}.{signature}` in cookie `telos_client_session`.
    Cookie uses `SameSite=None; Partitioned` for Whop iframe embedding.
- Two dashboards: `/thomas` (admin) and `/client-dashboard` (client PWA). Both are
  self-contained single HTML files — do NOT load shared `main.js` or `style.css`.
- Cron jobs authenticate via `Authorization: Bearer $CRON_SECRET` header.

## Bug patterns worth checking each run

- **Redis key cleanup on DELETE handlers**: many entity types own a fan of related
  keys (indexes, logs, lookup mappings). Grep for how each entity is *created*
  (all `SET`/`ZADD` calls that touch keys containing `{id}`) and compare against
  the `DEL`/`ZREM` calls in the DELETE handler. Missing cleanups leave orphan
  data and can silently block re-use of natural keys like email.
- **Rate limiting**: submit-* endpoints INCR a per-IP key with EXPIRE. Check that
  EXPIRE only runs on the first INCR (`if (count === 1)`), else the window
  extends forever.
- **Timing-safe compares**: HMAC signature checks should use
  `crypto.timingSafeEqual`. Length-checked short-circuits before a timing-safe
  compare still leak length.
- **Public form validation**: server MUST re-validate everything the client
  validates (email regex, required fields, allowed enum values). Client
  validation is UX-only.
- **innerHTML with dynamic strings**: any `innerHTML =` that concatenates
  user/API strings without an `escapeHtml` wrapper is a candidate. Templated
  content from Shopify (`descriptionHtml`) is expected to be raw.
- **Date handling**: `new Date().toISOString().split('T')[0]` gives UTC date,
  not local. Streak calculations that use "today" via this pattern will roll
  over at UTC midnight rather than user's local midnight. Confirmed known bug
  per CLAUDE.md — do not re-report unless a NEW instance appears.

## Documented known issues (do NOT re-report)

Per `CLAUDE.md` Known Limitations:

- Whop iframe on Safari/iOS blocks client login cookies. Future fix: token +
  Authorization header for iframe context.
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) do not load
  `js/main.js`. Documented in P1-P3 backlog.
- Internal links use `.html` extensions in several places instead of clean
  URLs. Vercel `cleanUrls: true` redirects, so still works.
- `todayStr()` UTC timezone bug in client dashboard streak calculation.
- Service worker cache version bump not applied consistently.

## False-positive patterns to avoid

- **Shopify Storefront API token in `js/shop.js`** is intentionally public.
  Storefront tokens are meant for client-side use with limited scopes.
- **`innerHTML = product.descriptionHtml`** in `js/shop.js:199` uses Shopify's
  sanitized rich text output — expected pattern for a Shopify integration.
- **Absent alt text on decorative images** (e.g. `alt=""` on chs-hero.jpg) is
  correct per WAI-ARIA — decorative images should have empty alt.
- **`SameSite=None` on client session cookie** is intentional (Whop iframe).
  Admin cookie stays `SameSite=Strict`. Do not flag as insecure.

## Notes on future rotations

- **Visual/UX (day 1)**: check chs.html at narrow breakpoints, verify hamburger
  works on tool pages (they don't load main.js so it uses inline duplicate).
- **Performance (day 2)**: `client-dashboard.html` is 278KB single file with
  everything inline. Worth measuring TTI and asking whether inlining is still
  the right call, or if code splitting would help.
- **Security (day 3)**: scan `git log -p` for accidentally-committed secrets;
  `npm audit` on any package.json; check `dangerouslySetInnerHTML` /
  `eval(` / template-string SQL patterns.

## Log of runs

### 2026-07-21 (Functional, first run)

- Bootstrapped agent/ and docs/ scaffolding — these did not exist.
- Read all `api/lib/*`, `api/client/*`, `api/dashboard/*`, `api/cron/*`,
  main HTML pages, `js/*.js`, and `vercel.json`.
- 1 P1 finding: client DELETE incomplete cleanup (see report).
- Noted for later: reset-password.js has an email-enumeration timing
  side-channel (response time differs by ~2 Redis calls + Resend HTTP call
  when email exists vs. not). P3, watch for future runs.
- Noted for later: URL `?reset=` query param not cleared after successful
  password reset — user hitting refresh gets stale form with invalid token.
  P3, low impact.
