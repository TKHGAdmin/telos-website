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
- Shopify Buy SDK v3 integration on product.html and shop.html — was recently updated (commit `c1e3162`). Reviewed this run; wiring held up. Worth re-checking if Thomas changes product data.
- Scroll-scene logic on /coaches — recent (commits `1ac858d`, `5a75f3d`). Reviewed this run; no bugs found. Watch for resize regressions after any future scroll-scene edit.

### Patterns noticed in first run (worth folding into the hunt next time)
- **Dashboard contract drift:** `/thomas` client code uses snake_case field names (`monthly_rate`, `follow_up_date`, `scheduled_date`, `amount`/`campaign`, `created_at`, `score`) while every `/api/dashboard/*` route uses camelCase (`monthlyRate`, `followUpDate`, `scheduledDate`, `spend`/`campaignName`, `createdAt`, `quizScore`). This single style split caused 5 of today's findings. Next run (any focus), grep `thomas.html` for any new snake_case fetch bodies or reads — likely more lurking.
- **Dashboard id-routing split:** every PUT handler under `/api/dashboard/*` requires `body.id`; every DELETE handler accepts `req.query.id || body.id`. The client always builds the path as `?id=X` and omits `id` from PUT bodies. Four of today's findings stem from this one asymmetry. Any new PUT route or edit button is a candidate.
- **Silent `.catch()`:** `thomas.html:1242` swallows errors without logging — masking the Convert-to-Client failure. Grep for `\.catch\(function\(\)\s*\{\}\)` on next pass to find more hidden failures.
- **Grid layouts with new siblings:** `product.html` introduced a third child into a two-column grid (image + thumbs + info) and the info column dropped to row 2. Any new grid-child insertion is worth a layout sanity check.
