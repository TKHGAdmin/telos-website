# Bug Hunter Learnings

Running log of patterns, false-positive classes, and areas explored. Keep under 2000 lines.

## 2026-10-12 (first run, Visual/UX focus)

### Setup gaps noticed
- The agent scaffolding referenced by `AGENT.md` did not exist at run time. Had to create `agent/memory/` and `agent/reports/`. `docs/BUG_REPORT_SCHEMA.md` is still missing; today's report uses a sensible default layout.
- `focus-rotation.json` initialized today. Rotated to performance for 2026-10-13.

### Known-issue checklist (do NOT re-flag unless the fix is pushed and still broken)
These are documented in `CLAUDE.md` -> "Known Limitations" / "Bug crawl P1-P3 backlog":
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) do not load `js/main.js`; they have inline hamburger handlers that duplicate main.js logic.
- `.html` extensions in internal links across multiple pages (38 occurrences of `href="index.html"` across 7 pages). Clean URL convention is documented but not enforced.
- `todayStr()` UTC timezone bug in client dashboard streaks.
- Service worker cache name is still `telos-v1`; CLAUDE.md calls out that a bump is needed.
- Whop iframe login breakage on Safari/iOS is a known third-party-cookie limitation; not a regression.

### Patterns to watch
- The newest commits add product/shop pages. Any CSS Grid with more than 2 direct children on a 2-column `grid-template-columns: 1fr 1fr` without explicit `grid-column` / `grid-row` placements is a layout smell — it silently wraps and swaps the intended column of trailing children.
- Interactive elements built from `<div onclick=...>` with no `role="button"`, `tabindex`, or keyboard handler are a recurring a11y gap. Flag them when they're on a core path (gallery, cart, nav). Skip them when they're clearly decorative.
- URL/variable string concatenation inside inline `onclick="..."` handlers is fragile but low-risk in practice because Shopify CDN URLs don't contain apostrophes. Note once, don't re-report each occurrence.

### Areas explored for the first time
- `/shop.html`, `/product.html`, `/js/shop.js` (new Shopify storefront integration).
- `/chs.html` (Charleston landing page, hotel aesthetic).
- `/sw.js` (service worker, confirmed cache version is a documented known issue).
