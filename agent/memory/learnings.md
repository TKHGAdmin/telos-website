# Bug Hunter — Learnings

Accumulated knowledge from daily runs. Append-only; compress older entries when this file passes 2000 lines.

## False-positive patterns to avoid

- **Shopify Storefront API tokens are public.** The token in `js/shop.js` (`SHOPIFY_STOREFRONT_TOKEN`) is a public Storefront API token by design — Shopify's Buy SDK requires it client-side. Do NOT flag it as an exposed secret. The Admin API token is the one that must never appear in client code.
- **Hardcoded "$" in cart subtotal is intentional.** The Telos shop is a US business; do not flag missing currency localization as a bug.
- **`x-forwarded-for` concat is fine for rate-limiting.** Vercel passes a comma-separated proxy chain; the key still partitions per client.

## Codebase quirks

- The repo has NO build step — pure HTML/CSS/JS served by Vercel. There is no `npm test`, no TypeScript, no bundler. Static analysis = reading. Lint = manual.
- Cache-busting convention: `?v=N` query string on shared assets. Currently `?v=16` on style.css, `?v=2` on main.js. Per-page scripts (e.g. `shop.js`) have their own bumps and can drift between pages — watch for this.
- Internal links should use clean URLs (no `.html`) per CLAUDE.md, but `index.html#anchor` is tolerated for hash links to homepage sections. Already documented as a known P1-P3 backlog item.
- Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained — they intentionally do NOT load `main.js` or `style.css`. Tool/marketing pages DO load `main.js`.
- Quiz/email POSTs are non-blocking "silent fail" by design. Network errors in those flows do not block the user.
- Public marketing pages live at the repo root (`index.html`, `pricing.html`, etc.). API endpoints live under `api/`. Blog articles live under `blog/`.

## Known unresolved issues (do not re-report unless context changes)

- Bug crawl P1-P3 backlog (commit `7fa38ff`): tool pages missing main.js, `.html` extensions in some internal links, `todayStr()` UTC timezone bug in client dashboard streaks, SW cache version bump needed.
- Whop iframe on Safari/iOS: client login broken in third-party-cookie context. Workaround documented; no fix planned without token-auth rework.

## Areas explored

| Date | Files / endpoints | Notes |
|---|---|---|
| 2026-06-22 | js/shop.js, shop.html, product.html, api/submit-quiz.js, api/submit-email.js, vercel.json | First run. Found broken product-detail grid layout (3 children in 2-col grid). Noted shop.js cache version drift between shop.html (v=1) and product.html (v=2). |
