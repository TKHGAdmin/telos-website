# Telos Bug Hunter - Learnings

Accumulated knowledge from daily runs. Keep under 2000 lines; compress older entries into a summary when it grows.

## Bootstrap - 2026-10-19

### Repo map
- Pure HTML/CSS/JS, no build step, Vercel + Upstash Redis.
- Public pages: `index.html`, `pricing.html`, `chs.html`, `shop.html`, `product.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`.
- Private dashboards (self-contained, no shared main.js/style.css): `thomas.html`, `client-dashboard.html`.
- Shared JS: `js/main.js`, `js/quiz.js`, `js/shop.js`.
- API: `api/submit-*.js` (public, rate-limited), `api/client/*` (client session cookie), `api/dashboard/*` (admin session cookie), `api/cron/*` (CRON_SECRET).
- CLAUDE.md documents the full conventions - read it on every run before hunting.

### Convention gotchas worth checking regularly
- **CSS cache busting**: all pages reference `css/style.css?v=16`. Mismatches between pages after a style.css edit = stale CSS for some users.
- **JS cache busting**: `js/main.js?v=2` is standard. `js/shop.js` is referenced from `shop.html` at `?v=1` and from `product.html` at `?v=2`. Any mismatch means one page can serve a stale cached copy to a user who hit the other version first.
- **No em dashes**: CLAUDE.md says use `-`, never `—` or `--`. Grep for `—` in authored source finds violations.
- **Clean URLs**: Vercel `cleanUrls: true` means internal links drop `.html`. Links that keep `.html` still work but break the convention; checking is low value.
- **Service worker cache**: `sw.js` uses `CACHE_NAME = 'telos-v1'`. Bump this name when static assets change substantively, or clients get stale PWA shells.
- **body.page-load-anim**: only `index.html` opts in. Adding it to other pages causes blank-flash.
- **Pricing page gating**: `pricing.html` is behind a quiz overlay stored in `localStorage.telosQuizCompleted`. Clearing it is the fastest way to re-test.

### Recurring risky patterns
- **origHTML capture before mutation**: multiple spots capture button HTML into `origHTML` and restore it in `setTimeout`. If the capture happens AFTER an error state replaces the button text, the restore locks the stale state in. Found in `js/shop.js:227` (`addToCartFromDetail`). The sibling `addToCart` at `js/shop.js:304` avoids this by hardcoding the restore markup.
- **Inline onclick with templated IDs**: `shop.js` uses `onclick="updateCartItemQty('${lineItemId}', N)"` and `onclick="addToCart(this, '${variant.id}')"`. Fine for Shopify opaque GIDs (no quotes inside) but a landmine if any upstream value ever contains a single quote. Not a bug today; worth re-checking if IDs ever change source.
- **Public tokens**: Shopify Storefront Access Token in `js/shop.js:15` is intentionally public per Shopify's design. Not a leak - do not flag this on future runs.

### False-positive patterns to avoid
- `js/shop.js:15` SHOPIFY_STOREFRONT_TOKEN is NOT a leaked secret - Storefront API tokens are designed to be public and scoped.
- `product.descriptionHtml` set to `innerHTML` is NOT XSS - source is the store owner's own Shopify admin.
- The two `?v=` versions on `shop.js` are NOT currently serving different code - both URLs resolve to the live file; this is a maintainability warning, not a user-facing break.

### Areas not yet explored
- `thomas.html` dashboard (161k lines of HTML+inline JS) - very large surface, treat each tab as a separate hunt.
- `client-dashboard.html` (278k lines, PWA, offline-capable) - lots of state transitions.
- `api/cron/*` - cron handlers that fail closed if envs are missing; worth a focused day.
- Blog SEO: 23 articles with Schema.org JSON-LD. Likely a Visual/UX day target.
