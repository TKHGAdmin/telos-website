# Telos Bug Hunter — Learnings

Accumulated knowledge from previous runs. Kept under 2000 lines.

## Bootstrap notes (2026-09-21)

First run. Agent infrastructure (`agent/memory/`, `agent/reports/`, `docs/BUG_REPORT_SCHEMA.md`) was not present in the repo — I created the memory files. `docs/BUG_REPORT_SCHEMA.md` still does not exist; I used a sensible internal schema for today's report (see `agent/reports/2026-09-21.md`) and left the docs untouched so as not to modify anything outside `agent/`. Thomas should either commit a canonical schema in `docs/` or accept the shape used today.

## Codebase shape (as of 2026-09-21)

- Pure static HTML/CSS/JS on Vercel. No build step, no framework.
- Two dashboards (`thomas.html`, `client-dashboard.html`) are self-contained — inline `<style>` and `<script>`.
- `shop.html` and `product.html` were added in the last ~2 weeks; both load `js/shop.js` (Shopify Buy SDK v3) for cart + product rendering. Cart drawer markup is duplicated between the two.
- The Shopify Storefront token in `js/shop.js:15` is a public client-side token by design — not a real secret. Do NOT report it as an exposed secret again.

## Confirmed false-positive patterns (avoid reporting)

- Shopify Storefront tokens in client JS — public by design.
- Style-preference nits (spacing, naming, "could be cleaner") — never bugs.
- Duplicated cart-drawer markup across `shop.html` and `product.html` — not a bug; the site has no shared header/footer includes.

## Open observations to revisit

- `js/shop.js` still uses `shopifyClient.checkout.*` (create/fetch/addLineItems). Shopify's Storefront API deprecated the Checkout API in the 2024-04 release in favour of Cart API. On stores updated past that API version the current code will break silently. Not yet reported because I could not confirm the store's current API version — flag if a real customer report of "cart broken" comes in.
- All cart drawer `onclick` handlers interpolate raw Shopify line-item IDs into JS strings. Today those IDs are quote-free GIDs, but any future Shopify id shape change (or a `'` character) would break rendering. Consider migrating to `addEventListener`.
