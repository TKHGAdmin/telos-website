# Bug Hunter — Accumulated Learnings

## About this file
Running notebook of patterns, false-positive traps, and codebase geography learned from each daily run. Kept under 2000 lines; older entries compressed into summaries as needed.

## Codebase geography (first-pass notes)

- **Static site + Vercel serverless.** No build step. HTML files sit at repo root; JS is either inline (dashboards, tool pages) or in `js/*.js` (shared).
- **Two brand-new features (recently committed):** `shop.html` and `product.html` powered by `js/shop.js` + Shopify Buy SDK v3 (CDN). Cart drawer is duplicated inline on both pages. This is the most likely hotspot for regressions since it's the freshest surface area.
- **CLAUDE.md is unusually comprehensive** — it documents Redis key schema, cron schedules, env vars, and design tokens. Treat it as the canonical spec; a divergence between CLAUDE.md and the code is often the bug.
- **Client & admin dashboards are self-contained** (thomas.html, client-dashboard.html) — they intentionally do NOT load `main.js` or `style.css`. Don't report "missing main.js" on those.
- **Cart drawer HTML is inlined in both shop.html and product.html.** Any DOM contract change (renamed id, moved element) has to be applied in both places. This is a maintenance smell worth watching for drift bugs.

## Infrastructure notes (bootstrapping)

- `docs/BUG_REPORT_SCHEMA.md` was referenced by the system prompt but did not exist at bootstrap. Report format used is a reasonable inference: front-matter summary, findings grouped by severity, each with a Location / Repro / Impact / Suggested-fix block. If the run.py orchestrator later fails to parse, that's the reason to reconcile.
- `agent/memory/` and `agent/reports/` did not exist. Created on first run. `decisions.jsonl` will accumulate as Thomas approves or denies findings.

## Reusable heuristics

- **CSS grid + JS-populated children:** if the HTML source has N children of a `grid-template-columns: 1fr 1fr` container, look at whether the middle ones stay empty. An empty div still consumes a grid cell and shoves later siblings into the wrong row.
- **innerHTML with template literals + attribute interpolation** (e.g. `onclick="foo('${id}')"`) is safe only as long as `id` never contains a quote. Flag these when the source of `id` is user-typed or third-party (not for Shopify GraphQL IDs, which are fixed-format `gid://...`).
- **Cart / checkout paths silently doing nothing** (e.g. `if (cart.checkoutUrl) { navigate }` with no else) are UX bugs worth flagging when the failure mode is invisible to the user.

## False-positive traps to avoid

- Do NOT flag `descEl.innerHTML = product.descriptionHtml` on Shopify-sourced content as XSS — Shopify Admin content is owner-controlled and rich HTML is the intended behavior. Only flag if the source is user-submitted.
- Do NOT flag `main.js` as missing on `thomas.html` / `client-dashboard.html` — self-contained by design (per CLAUDE.md).
- Do NOT flag `.html` extensions missing from internal links — `vercel.json` has `cleanUrls: true` and CLAUDE.md documents this convention.
- Do NOT report the Shopify Storefront token in `js/shop.js` as a leaked secret — Storefront tokens are designed to be public (browser-side) and are scope-limited by Shopify.
