# Bug Hunter Learnings

Append-only log of patterns the agent learns over time. Compress entries older than 90 days into a single summary when this file exceeds 2000 lines.

---

## 2026-06-08 — First run, bootstrap

### Repo shape
- Static HTML/CSS/JS, no build step. 8 public root pages: `index`, `pricing`, `chs`, `shop`, `product`, `protein-calculator`, `hyrox-predictor`, `resources`. Plus `thomas.html` (admin) and `client-dashboard.html` (PWA), both self-contained.
- `js/main.js` is the shared script for public marketing pages. `js/shop.js` is shop/product-only. `js/quiz.js` runs on index + pricing.
- Vercel `cleanUrls: true` strips `.html` automatically. Internal links should NOT use `.html` extension - but many still do (see CLAUDE.md known backlog).
- Cache busting uses `?v=N` query strings on `style.css`, `main.js`, `shop.js`. Versions must be bumped on every page when the underlying file changes.

### Areas with the newest code (highest bug-density risk)
- Shopify integration (`js/shop.js`, `shop.html`, `product.html`) - added in last ~10 commits.
- Charleston landing (`chs.html`, `api/submit-chs-application.js`) - added recently.
- Client dashboard rebuild (FAB, nutrition, supplements, activity logging).

### Known issues already in CLAUDE.md backlog (DO NOT re-report)
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) missing `main.js` script tag.
- `.html` extensions in internal links across many pages.
- `todayStr()` UTC timezone bug in client dashboard streak calculation.
- SW cache version bump needed.
- Whop iframe Safari cookie limitation.

### Patterns to watch on future runs
- **Cache version drift**: when a JS file is updated, the `?v=N` query parameter must be bumped on EVERY HTML page that loads it. Easy to miss when many pages share a script.
- **New page created from copy/paste of existing page**: nav blocks get duplicated, so updates to nav on one page rarely propagate. SEO meta tags also often get missed.
- **Shopify Storefront token is public by design** - it is intended to ship in client JS. Do not flag it as an exposed secret.
- **Inline `onclick` handlers** with interpolated URLs/IDs from third-party data (Shopify variant IDs, image URLs) are fragile but not currently exploitable because Shopify normalizes those values.

### False-positive patterns to avoid (refine as denials come in)
- (None yet - decisions.jsonl is empty.)
