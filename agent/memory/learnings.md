# Telos Bug Hunter — Learnings

Accumulated knowledge from daily runs. Compress oldest entries when this file exceeds 2000 lines.

---

## 2026-06-21 — first run

### Codebase orientation
- Pure static HTML/CSS/JS, no build step. Vercel hosts the static site + serverless functions in `/api`.
- Shared chrome lives in `js/main.js` + `css/style.css`. Dashboards (`thomas.html`, `client-dashboard.html`) are intentionally self-contained — do not flag them for "not using shared styles."
- Tool pages (protein-calculator, hyrox-predictor) ship their own inline `<script>`. Per CLAUDE.md, they must NOT duplicate hamburger/nav handlers — main.js already owns those.
- Internal links use clean URLs (no `.html`). Vercel's `cleanUrls: true` handles routing. Blog pages use `../` prefix because they live one level down.
- Pricing-page CSS uses `p-` prefix classes inline. Do not flag those as missing from `style.css`.

### False-positive patterns to avoid
- **Shopify Storefront token in client JS** (`js/shop.js:15`): Storefront API tokens are designed for public exposure (read-only catalog). Not a leaked secret. Skip.
- **Inline styles on dashboards**: `client-dashboard.html` and `thomas.html` intentionally inline all CSS. Don't flag them.
- **"No services required" on CHS form**: CLAUDE.md doesn't say services is required; server accepts empty array by design.
- **`product.descriptionHtml` rendered via innerHTML** in shop.js: this is content authored by the store owner in the Shopify admin — intended HTML.

### Today's hunt — what I checked
- Recent shop/product page work (commits `c1e3162`..`f5cb8c4`)
- `chs.html` submit flow + `api/submit-chs-application.js`
- `vercel.json` for routing/cron config

### Findings
- 1× P1 layout bug in `product.html`: `productThumbs` div added as a direct grid sibling, breaking the 2-column layout for every product page on desktop. Filed as BUG-20260621-01.

### Areas not yet explored (carry over)
- Cron endpoints (`api/cron/weekly-summary.js`, `engagement-check.js`) — only skimmed
- Client portal endpoints (`api/client/*`) — auth + writes — high-value for future security run
- `thomas.html` admin dashboard JS — large file (161 KB), worth a dedicated pass
- Blog pages (23 files) — never read individually, only via grep
- Service worker (`sw.js`) push notification path
- `js/quiz.js` shared between index + pricing — context-detection logic
