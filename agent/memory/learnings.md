# Agent Learnings

Accumulated knowledge that survives across runs. Updated at the end of every run. Keep under 2000 lines total — compress older entries into a summary line when close.

## Codebase orientation

- **No build step**: pure HTML/CSS/JS + Vercel serverless functions. `npm test`, `tsc`, and bundle analysis do not apply.
- **Two dashboards are self-contained**: `thomas.html` and `client-dashboard.html` inline all their CSS/JS and do NOT load `js/main.js` or `css/style.css`. Do not report "missing main.js" on those two.
- **Public pages should all load `js/main.js`**: nav / hamburger / scroll behavior lives there.
- **CLAUDE.md documents known limitations** at the bottom — check that section before flagging anything as a bug. Currently documented as known:
  - Whop iframe on Safari/iOS: client login fails due to third-party cookie policy.
  - `todayStr()` UTC timezone bug in client dashboard streaks.
  - Tool pages missing main.js on some pages.
  - SW cache version needs bumping when static assets change.
  - Some internal links still carry `.html`.
- **CSS cache-buster convention**: `?v=N` on stylesheet references. Currently `?v=16` on public pages. If `style.css` changes and the version is not bumped, users see stale styles — that IS a real bug.

## Redis / data-model gotchas

- `client_email:{email}` is a lookup that is created only when portal is enabled via `client-portal.js` POST. `clients.js` POST does not create it, so the pre-portal duplicate-email check has a hole (see BUG-20260801-02).
- `client:{id}` DELETE in `clients.js` does NOT clean up `client_email:{email}` or any of the per-client daily/nutrition/training log keys. Orphaned data accumulates.
- Password comparison uses `crypto.timingSafeEqual` in both admin and client auth. Don't flag those as timing-attack vulns.

## False-positive patterns to avoid

- **Shopify Storefront token in client code** is by design — it's a public read-only token, not a secret. Do not flag it.
- **`x-forwarded-for` trust on Vercel** — Vercel edges set this header; treating it as authoritative for rate-limit keys is acceptable at this scale.
- **Push notification stub in `api/client/notify.js`** — the code comment explicitly acknowledges the missing VAPID / RFC 8291 encryption. Note it once, don't re-report every run until the code changes.
- **`descriptionHtml` innerHTML injection in `shop.js`** — the field is Shopify-sanitized admin content, not user input. Not an XSS vector.

## Rotation history

- 2026-08-01: **Functional** — first run. Bootstrapped scaffolding. Found 2 confirmed bugs (product-page grid layout regression, orphaned email lookup on client delete).
