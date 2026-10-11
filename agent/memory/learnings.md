# Bug Hunter Learnings

Running knowledge for the Telos Bug Hunter agent. Keep under 2000 lines; compress when it grows.

---

## Codebase shape

- Pure HTML/CSS/JS (no framework, no build step). Vercel-hosted static site + serverless `api/*.js`.
- Storage: Upstash Redis via REST (`api/lib/redis.js`). No ORM, no migrations — Redis keys are plain string handles documented in `CLAUDE.md`.
- Two cookie-based auth stacks that must not be mixed up:
  - **Admin** (`api/lib/auth.js`): `telos_dash_session`, `SameSite=Strict`, 2-part token `expires.signature`, non-timing-safe `!==` signature comparison (worth flagging on security days — client-auth does it correctly).
  - **Client** (`api/lib/client-auth.js`): `telos_client_session`, `SameSite=None; Partitioned` (for Whop iframe), 3-part token `clientId.expires.signature`, uses `crypto.timingSafeEqual`.
- Dashboards (`thomas.html`, `client-dashboard.html`) are intentionally self-contained — no `main.js`, no `style.css`.
- Known-and-documented limitations (CLAUDE.md § Known Limitations): Whop iframe cookies on iOS Safari, `todayStr()` UTC bug in client dashboard streaks, SW cache version bump needed, tool pages missing `main.js`, `.html` in some internal links. **Do not re-report these.**

## Patterns worth hunting

- **Form `type="button"` + inline validators absent** on quiz, email captures, CHS application — HTML `required` is skipped when the button isn't `type="submit"`, and the frontend doesn't always re-check.
- **Redis lookup lifecycle**: `client_email:{email}` is created in `client-portal.js` on enable and deleted on disable, but **not** cleaned up by `clients.js` DELETE. Any key that's written in one endpoint and never cross-referenced by the delete path of another is a candidate.
- **`x-forwarded-for` as rate-limit key**: used raw in `submit-quiz.js`, `submit-email.js`, `submit-chs-application.js`. On Vercel the client can prepend values, so the key is partly attacker-controlled. Note but confirm against prod before reporting as a defect — Vercel edge behavior changes.
- **UTC `toISOString().split('T')[0]`** is the project's standard "today string". Streaks, indexes, and daily keys use it everywhere. Reporting it in one place is enough; focus on secondary effects (missed logs around midnight UTC, cron day-slicing in `api/cron/weekly-summary.js`).
- **Inline HTML interpolation** in email templates (`reset-password.js`, `weekly-summary.js`) — content comes from coach-controlled fields (`client.name`, `client.email`), so XSS surface is low. Flag only if an untrusted field reaches an HTML sink.

## False-positive patterns to avoid

- Hard-coded `SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js` — Storefront API tokens are **public by design**. Not a leak.
- Inline `onclick` attributes with product/variant/image URLs from Shopify — admin-controlled values. Not a user-exploitable XSS surface.
- The `verifyToken` admin-auth `!==` comparison is non-timing-safe but exploiting it over network is unrealistic. Downgrade to P3 and only report on Security days.
- Any item listed in CLAUDE.md § Known Limitations.

## New areas explored this run

- All `api/client/*.js` endpoints (daily-log, nutrition-log, training-log, activity-log, supplement-log, food-search, reset-password, login).
- All `api/dashboard/clients.js` and `api/dashboard/client-portal.js` CRUD paths.
- `js/quiz.js` end-to-end from question render through lead capture, pricing-page overlay dismissal, `telosQuizCompleted` flag.
- `js/shop.js` cart init, product detail, add-to-cart, checkout handoff.
- `sw.js` cache + push flow.
- `js/main.js` nav/scroll/animations.
- Cron handlers (`weekly-summary.js`).

## Backlog to probe on future runs

- **Visual/UX day**: run axe-core on `/pricing` quiz overlay (focus trap? ESC to close?), check mobile overflow on `/chs` serif headlines, verify the client-dashboard FAB popup covers the active tab bar on short viewports.
- **Performance day**: measure uncompressed size of `client-dashboard.html` (5.2k lines, all inline) and `thomas.html` (3.2k lines) — likely over 300 KB each.
- **Security day**: revisit `verifyToken` timing-safe compare, and sweep `x-forwarded-for` rate-limit bypass with a reproduction against prod.
- Audit `api/dashboard/content.js`, `revenue.js`, `adspend.js`, `pipeline.js` (not read yet this run).
