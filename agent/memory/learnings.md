# Telos Bug Hunter - Learnings

Accumulated knowledge for the daily bug-hunting agent. Kept under 2000 lines - compress older entries into summaries if exceeded.

---

## 2026-07-30 - Bootstrap run

**Scaffolding.** First run of the agent. Neither `agent/` nor `docs/BUG_REPORT_SCHEMA.md` existed. Bootstrapped `agent/memory/` and `agent/reports/`. `docs/BUG_REPORT_SCHEMA.md` was NOT created (agent hard rule: write only to `agent/`); using a self-contained schema documented at the top of each report until Thomas provides a canonical one.

**Site fingerprint (as of today).** Pure static HTML/CSS/JS, no build step. Public marketing pages at repo root. Admin dashboard at `thomas.html` (self-contained inline CSS/JS, no shared assets). Client PWA at `client-dashboard.html` (also self-contained). Serverless API in `api/*` (Vercel + Upstash Redis, no npm deps beyond runtime). Recent Shopify Buy SDK integration added a new `shop.html` + `product.html` + `js/shop.js` and a cart drawer duplicated on both pages.

**Known non-bugs (avoid re-flagging).**
- `SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js` is a Shopify Storefront API token, which Shopify designs to be public/browser-side. Do NOT report as a leaked secret.
- `descEl.innerHTML = product.descriptionHtml` in `js/shop.js` renders Shopify-admin-authored HTML in a trusted-content context. Do NOT report as generic XSS.
- The 4 SVG app-icon references (`telos-icon-*.svg`) are deprecated per CLAUDE.md but not referenced anywhere in code. Do NOT report as "broken icon references".
- `client-dashboard.html` and `thomas.html` intentionally do NOT load `js/main.js` or `css/style.css` (self-contained pattern). Do NOT report the missing script tags as bugs.
- `body.page-load-anim` is intentionally only on `index.html` (documented in CLAUDE.md). Do NOT report as inconsistency.

**Patterns to hunt tomorrow (focus 2 - Performance).**
- Bundle size / image weight in `/images/` (any oversize PNGs shipping to marketing pages?).
- Shopify Buy SDK loaded from CDN adds ~150kb+ on shop/product pages. Check if it blocks render.
- `client-dashboard.html` is 278kb - single monolithic file. See if this cripples first-load on mobile.
- Blog articles - 23 files, each with inline `<style>`. Any easy wins from extracting shared bits? (Style-only; don't recommend unless it's a real perf win.)
- Any polling loops or unbounded intervals in `js/main.js` or the dashboards?

**Bug-hunt shortcuts learned.**
- New Shopify commits (f5cb8c4, 21cc926, 8512e4e, 6fb77e9, 4b1bd3c) landed in a burst. Recent-change churn is a rich hunting ground and should always be checked first.
- CLAUDE.md is the source of truth for conventions - always cross-check "is this actually a bug" against its documented patterns before flagging.
