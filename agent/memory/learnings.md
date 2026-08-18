# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Update at the end of each run. Keep under 2000 lines; compress older entries when it grows.

---

## Meta

- **First run**: 2026-08-18. Bootstrapped `agent/memory/` and `agent/reports/` from empty state.
- **Missing infra**: `docs/BUG_REPORT_SCHEMA.md` does not exist. Rule #2 forbids writing outside `agent/`, so reports use a self-consistent schema (see any existing report for the shape). Ask Thomas whether to author the schema doc separately.
- **No decisions yet**: `decisions.jsonl` is empty. No approval/denial signal to calibrate against. Bias hard toward high-precision findings until the loop closes.

## Codebase orientation

- Pure HTML/CSS/JS site + Vercel serverless functions in `api/`. No build step.
- Two admin surfaces are self-contained (all CSS/JS inline): `thomas.html` (161 KB) and `client-dashboard.html` (272 KB). They do NOT load `main.js` or `style.css`.
- Marketing pages load `css/style.css?v=16` and `js/main.js?v=2`. Cache-bump the version when editing `style.css`.
- API routes use `redisPipeline` for batched reads (see `api/dashboard/clients.js`, `api/client/training-log.js`) — no obvious N+1 patterns.
- Recent additions to watch: `shop.html`, `product.html`, `js/shop.js` (Shopify Buy SDK integration, ~11 commits in the last two weeks).

## False-positive traps (do NOT report these)

- **Shopify Storefront API token in client JS** (`js/shop.js:15`). This token type is DESIGNED to ship to browsers — it is a public, read-scoped credential per Shopify's docs. Not a leak.
- **Scripts loaded without `defer`/`async`** at the end of `<body>`. They naturally execute after parse; the attribute is not required.
- **Google Fonts `<link>` in `<head>`** is expected — it uses `preconnect` on the previous two lines. Fine.

## Recurring themes to keep an eye on

- Every marketing HTML file duplicates the same Google Fonts request (Bebas Neue + DM Sans + Outfit 300–900 + Space Mono 400/700). Outfit weight 800 is loaded but not used per a grep of `font-weight:` in `css/style.css`. Minor.
- `client-dashboard.html` is 272 KB inline. Big single doc — worth periodically scanning for dead code, unused inline `<style>` blocks, or `console.log` noise, but do not report unless a concrete impact is measurable.
