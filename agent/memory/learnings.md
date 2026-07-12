# Agent Learnings

Accumulated knowledge from prior bug hunter runs. Keep under 2000 lines.

---

## Codebase orientation

- Pure HTML/CSS/JS, no framework, no build step. `npx serve -l 3000 .` (do NOT use `-s`).
- Static pages at repo root, serverless functions under `api/`, admin dashboard is `thomas.html` (self-contained), client portal is `client-dashboard.html` (self-contained, PWA).
- Shop stack: `shop.html` (product grid), `product.html` (detail page), `js/shop.js` (Shopify Buy SDK v3, storefront token is public by design so do NOT flag it as a leaked secret).
- Redis (Upstash) via REST, no npm deps.
- Shared stylesheet is versioned via `?v=N` — bump when changing `css/style.css`.

## Known false-positive patterns (do NOT report as bugs)

- **Public Shopify Storefront access token** in `js/shop.js:15`. Storefront tokens are meant to be exposed in client code; Shopify's docs explicitly say so. Only flag if it's an *Admin* token (starts with `shpat_`) or an API secret.
- **Hardcoded Calendly URLs** across pages. Intentional, tier-specific booking links documented in CLAUDE.md.
- **body.page-load-anim only on index.html**. Intentional per CLAUDE.md — do not flag the missing class on other pages.
- **`.html` extensions in some internal links**. Documented in CLAUDE.md as a known P1-P3 backlog item, not a new finding.
- **Duplicate cart badge IDs (`cartBadge` on desktop nav, `cartBadgeMobile` on mobile nav)**. Only one is ever visible at a time, and `updateCartBadge()` uses `.cart-badge` class selector so both stay in sync. Fine as-is.

## Verified reproduction techniques

- **Grid layout regressions**: inject fake DOM via Playwright `page.evaluate`, then read `getBoundingClientRect()` of each grid child. If children unexpectedly appear in new rows, layout is broken. Screenshot alone can miss regressions that only trigger with specific product shapes.
- **Shopify-dependent pages** cannot be tested against a real product without live API. Bypass by manually driving the DOM population that `loadProductDetail`/`loadProducts` would do, then compare bounding rects.

## Areas explored

- `js/shop.js`, `shop.html`, `product.html`: shop stack, cart drawer, image gallery.
- `docs/BUG_REPORT_SCHEMA.md`: bootstrapped on first run.

## Patterns to watch for next time

- **Grid child count vs `grid-template-columns`**: whenever a feature commit adds a new direct child to a grid container, check the columns rule and mobile media query. This is exactly what broke on commit `f5cb8c4`.
- **Silent init in `js/shop.js`**: any error inside `DOMContentLoaded` handler falls through to `showEmpty()` (line 71) with no user-facing error state beyond the "Products coming soon" empty state. If a real Shopify config or network failure happens in prod, users will not distinguish it from "no products yet".
- **`escapeHtml` on URLs embedded in inline `onclick=` handlers** (shop.js:170): the URL is escaped for HTML but not for JS string context; a `'` in a Shopify CDN URL would break the handler. Currently very unlikely in practice but worth confirming next run.
