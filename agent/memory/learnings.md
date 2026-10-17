# Telos Bug Hunter — Learnings

Running log of patterns, codebase facts, and false-positive guards.
Keep under 2000 lines; compress older entries when it grows.

---

## 2026-10-17 — Bootstrap run

### Codebase facts discovered
- Pure HTML/CSS/JS, no build step. Vercel serverless functions in `api/`.
- Admin auth: `api/lib/auth.js`. Client auth: `api/lib/client-auth.js`. Both HMAC-signed cookies.
- Client IDs are integers (via Redis `INCR id:clients`), so the client token's dot-split parse is safe.
- Shopify Buy SDK v3 is loaded via CDN on `shop.html` and `product.html`; Storefront token is public by design.
- `shop.js` is loaded on both shop/product pages; both DOMs include the full cart drawer (`cartItems`, `cartFooter`, `cartDrawerCount`, `cartSubtotal`, `cartDrawer`, `cartOverlay`).

### Known-and-tracked backlog (do not re-report)
Per CLAUDE.md "Known Limitations" section:
- `.html` extensions in internal links (222 occurrences, 30 files) — tracked P2/P3.
- Tool pages missing `js/main.js` — tracked.
- `todayStr()` UTC timezone bug in client dashboard streaks — tracked.
- Service worker cache version bump needed — tracked.
- Whop iframe + Safari third-party cookie block — architectural limitation.
- Bug crawl P1-P3 backlog from April 2026 (commit `7fa38ff`) — tracked.

### False-positive guards for next runs
- Shopify Storefront token in client JS is PUBLIC by design (`shop.js:15`). Not a secret leak.
- `product.descriptionHtml` from Shopify is sanitized by Shopify on their end; rendering via `innerHTML` is the standard pattern. Not an XSS unless admin stores raw script.
- `index.html#anchor` links from other pages are tolerated by Vercel's `cleanUrls: true` and are tracked under the broader `.html`-extensions backlog — don't dupe.

### Reporting patterns observed
- Several API handlers rate-limit on `req.headers['x-forwarded-for']` without parsing the leftmost IP. Vercel typically normalizes this but worth tracking across endpoints: `submit-quiz.js:23`, `submit-chs-application.js:40`, potentially others.
- Admin password check uses `crypto.timingSafeEqual` but admin TOKEN verification uses plain `!==` — inconsistency with the file's own stated design.
