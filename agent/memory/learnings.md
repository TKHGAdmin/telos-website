# Bug Hunter Learnings

Accumulated knowledge across runs. Keep under 2000 lines. Compress older entries when needed.

## Codebase orientation

- **Zero build step.** Pure HTML/CSS/JS. Every page loads its own inline `<style>` for page-specific rules; shared styles live in `css/style.css`.
- **Public marketing pages load `js/main.js`** for nav/hamburger/scroll. **Tool pages** (`protein-calculator.html`, `hyrox-predictor.html`) intentionally do NOT load `main.js` and duplicate a minimal hamburger handler inline. This is a known P1-P3 backlog item — don't re-flag it.
- **Dashboards** (`thomas.html`, `client-dashboard.html`) are fully self-contained (own inline CSS + JS, no `main.js`).
- **Clean URLs.** Vercel `cleanUrls: true`. Internal links to `foo.html` violate convention. **Known backlog** — don't re-flag.
- **Cart drawer** exists only on `shop.html` and `product.html`. Cart badge/drawer are not present on other pages. If a user adds items on shop and navigates away, they can't see the cart from index/pricing/etc. Likely by design.
- **All quiz/email/CHS submission endpoints** rate-limit per IP with a Redis INCR + EXPIRE pattern. Look for missing rate limits on any new public POST endpoint.

## Known false-positive patterns (do NOT report)

- **Shopify Storefront API token in `js/shop.js`.** Storefront tokens are public by design — never call this a leaked secret.
- **`.html` extensions in internal links** — known P1-P3 backlog.
- **Tool pages missing `main.js`** — known P1-P3 backlog.
- **`todayStr()` UTC timezone bug in client dashboard streaks** — known P1-P3 backlog.
- **Missing SW cache version bump** — known P1-P3 backlog.
- **`parseFloat(variant.price)` fallback in `shop.js`** — defensive code around Shopify Buy SDK's price shape (`{amount, currencyCode}` vs string). NaN wouldn't occur in practice; not a bug.
- **CHS form leaves "Sending..." text on success** — form is visually disabled (opacity 0.35, pointerEvents none) and a status message appears; user isn't confused.

## Real patterns to watch for

- **`escapeHtml()` in `js/shop.js`** uses text-node serialization, which does NOT escape `"` or `'`. Safe in text content, unsafe inside HTML attribute values. Any new call site inserting the result into an `alt="…"` / `title="…"` / `data-*="…"` is a bug if the input may contain quotes.
- **`onclick="handler('${dynamic}')"` templates** in cart/thumb rendering embed variables into JS string literals inside HTML attributes. A single quote in the interpolated value would break both. Currently the inputs are Shopify-controlled so risk is theoretical, but any new user-supplied field flowed through this pattern is a hazard.

## Areas explored

- **2026-08-16 (functional):** `js/shop.js`, `product.html`, `hyrox-predictor.html`, `protein-calculator.html`, `chs.html`, `api/submit-*`, `api/dashboard/emails.js`, `vercel.json`. Nav consistency across public pages, footer presence, cart-drawer scope, anchor-target validity on `index.html`.
