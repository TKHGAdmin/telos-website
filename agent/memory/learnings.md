# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Kept under 2000 lines; older entries compressed as needed.

## Repo conventions (from CLAUDE.md)
- Pure HTML/CSS/JS, no build step, no framework.
- Clean URLs (no `.html` extension in internal links). Vercel's `cleanUrls: true`.
- No em dashes anywhere - use hyphens only.
- CSS cache-bust with `?v=N`. Currently `?v=16` on all pages.
- Public pages load `js/main.js`. Dashboards (thomas.html, client-dashboard.html) are self-contained.
- Only `index.html` should have `body.page-load-anim`.
- `.visible` class only scoped to `.animate-on-scroll.visible` in shared CSS.
- Blog articles use `../` prefix for nav links.
- App icons must be PNG (SVGs deprecated).
- Client login link before Book a Call in every public page nav (28 pages).
- Design colors: bg #060608, card #131316, gold #C9A84C, text #F4F1EC.

## Redis key patterns
- `client:{id}`, `client_email:{normalizedEmail}`
- `client_dailylog:{clientId}:{YYYY-MM-DD}` (+ index ZSET)
- Same shape for nutrition_log, 545_daily, training_log, supplement_log, activity_log.

## Not documented in CLAUDE.md (as of 2026-09-23)
- `shop.html` and `product.html` exist and use Shopify Buy SDK.
- Recent commits: image gallery on product page, add-to-cart repositioning.

## False-positive patterns to avoid
(populated by denials from decisions.jsonl)

## Files-explored history
- 2026-09-23: bootstrap run. First look at shop.html + product.html (Shopify integration).
  - shop.html loads js/shop.js?v=1; product.html loads ?v=2 — treat these as coupled going forward.
  - .product-detail is a 2-col grid; watch for any future addition of sibling children.
  - Shopify Storefront tokens are public by design — skip flagging.
  - product.descriptionHtml is rendered raw; Shopify admin is single-authored, so treat as trusted.
  - Shopify GID line-item IDs are safe in interpolated onclick attrs (opaque base64).

## Bug-hunt heuristics (starting checklist)
- Any time a grid/flex container gains a new child, count children vs `grid-template-columns` / `flex-wrap` intent.
- CSS/JS cache-bust versions must be bumped on ALL pages that load a changed file.
- Recent-commit diff review is high-signal: focus on files touched in the last 3-7 days.
