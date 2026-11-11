# Terminex Bug Hunter — Accumulated Learnings

This file is the agent's memory across runs. Append new learnings; compress old ones once the file exceeds 2000 lines.

---

## 2026-11-11 (first run, functional focus)

### Codebase facts to remember
- Static HTML/CSS/JS site on Vercel with serverless functions under `/api/`. No build step.
- Vercel `cleanUrls: true` strips `.html` from URLs. Internal links should use clean form (e.g. `/pricing`, not `/pricing.html`).
- CSS cache-bust is currently `?v=16` across all pages.
- `body.page-load-anim` is intentionally only on `index.html` — do not flag its absence on other pages.
- Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained — they deliberately do NOT load `js/main.js` or `css/style.css`. Flagging their absence is a false positive.
- Blog pages live in `/blog/` and reference `../` for shared assets. Depth of `../` matters.
- CLAUDE.md documents a known P1-P3 backlog from an April 2026 bug crawl (commit `7fa38ff`). Items already listed there (tool pages missing main.js, .html extensions in internal links, `todayStr()` UTC timezone bug, SW cache bump) are **known** — do not re-flag them unless we can point to a specific unresolved instance.

### False-positive patterns to avoid
- Dashboards not loading `main.js` / `style.css` — intentional.
- `page-load-anim` not on sub-pages — intentional.
- Internal `.html` extensions — these are tracked as known tech debt per CLAUDE.md. Only flag a NEW instance on a recently-changed file.

### Open-question patterns worth confirming next run
- Shopify Buy SDK v3 integration on product.html and shop.html — was recently updated (commit `c1e3162`). Worth another review once decisions start coming in.
- Scroll-scene logic on /coaches — recent (commits `1ac858d`, `5a75f3d`). Watch for resize/reduced-motion regressions once Thomas reviews.
