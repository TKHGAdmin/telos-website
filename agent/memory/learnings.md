# Bug Hunter - Learnings

Accumulated knowledge from daily runs. Patterns, gotchas, false-positive traps. Keep under 2000 lines.

## Codebase shape (bootstrap, 2026-06-27)

- Static HTML/CSS/JS. No build step. Vercel hosts; serverless under `/api`.
- Shared `js/main.js` handles nav/hamburger across public pages. Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained.
- All client-side cart/shop logic lives in `js/shop.js`. Shopify Buy SDK v3 is loaded from `sdks.shopifycdn.com`.
- Storefront API token (`SHOPIFY_STOREFRONT_TOKEN`) is meant to be public — do NOT flag it as a leaked secret. The Admin API token would be.
- Pricing page is gated behind a quiz overlay; quiz completion stored in `localStorage`.
- Production URL: `https://www.telosathleticclub.com`.

## Recurring patterns

- New shop/product code was added in commits `21cc926` -> `f5cb8c4` and has had several quick follow-up fixes. Anything in `shop.html` / `product.html` / `js/shop.js` is fresh and worth extra attention.

## Known false-positive traps

- (none yet — populate as denials roll in)

## Areas explored

- `shop.html`, `product.html`, `js/shop.js` (2026-06-27)
