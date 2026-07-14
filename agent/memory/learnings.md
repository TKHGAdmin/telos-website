# Telos Bug Hunter - Learnings

Accumulated knowledge about the codebase, common patterns, and false-positive traps. Keep under 2000 lines.

## Codebase shape

- Pure HTML/CSS/JS, no build step. Static pages + Vercel serverless functions.
- Two dashboard shells (`thomas.html`, `client-dashboard.html`) are self-contained: all CSS/JS inline. They do NOT load `main.js` or `style.css`.
- Public marketing pages load `js/main.js` for nav, hamburger, scroll animations.
- Redis (Upstash) is the only datastore. No SQL. No ORM.
- Auth: two separate cookie-based sessions - `telos_dash_session` (admin, HMAC) and `telos_client_session` (client, HMAC + PBKDF2 password hashing).

## Known unresolved backlog (do NOT re-report)

Per CLAUDE.md's "Bug crawl P1-P3 backlog" note (commit `7fa38ff`):
- Tool pages missing `main.js`
- `.html` extensions in some internal links
- `todayStr()` UTC timezone bug in client dashboard streaks
- Service worker cache version bump needed

Reference these by name if they recur, don't re-write them.

## Known limitations (documented, not bugs)

- Whop iframe on Safari/iOS: client portal login does not work (Safari blocks third-party cookies). Documented in CLAUDE.md.

## False-positive traps to avoid

- **Shopify HTML injection**: `descEl.innerHTML = product.descriptionHtml` on `product.html` looks like XSS but the source is the store owner's Shopify admin - trusted. Do not flag.
- **Storefront token in client JS**: `SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js` is the public Storefront API token, designed to be exposed. Not a secret leak.
- **CSS cache-busting version drift** (e.g. `?v=16` on most pages, `?v=1` vs `?v=2` on `js/shop.js`): worth flagging only if it causes user-visible breakage, not as pure hygiene.
- **Rate-limit key uses raw `x-forwarded-for`**: for low-traffic marketing endpoints (chs application, quiz submit), spoofable but low-impact. Only flag if the endpoint is high-value.

## Codebase quirks worth remembering

- Client session token format: `{clientId}.{expires}.{signature}` (3 parts). Any clientId containing a `.` would break `split('.')` parsing. Confirm clientId generation format when auditing.
- The `pricing.html` gate uses `localStorage.getItem('telosQuizCompleted') === 'true'` - trivially bypassable, but this is intentional soft-gating for lead capture, not access control.
- FAB button on client dashboard requires `display:'block'` (not `''`) because CSS default is `display:none` and `''` reverts to the CSS-declared value. See commit `fbaca96`.

## Recent surface areas explored

- 2026-07-14: `shop.html`, `product.html`, `js/shop.js`, `js/main.js`, `api/lib/auth.js`, `api/lib/client-auth.js`, `api/submit-chs-application.js`, `api/client/reset-password.js`.
