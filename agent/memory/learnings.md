# Bug Hunter Learnings

## Codebase orientation

- Pure HTML/CSS/JS, no build step. Hosted on Vercel with serverless functions in `api/`.
- Shared CSS at `css/style.css` (versioned via `?v=N`). Shared JS at `js/main.js` (handles nav, hamburger, dropdown toggle preventDefault, scroll animations).
- Public marketing pages all load `main.js`. Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained — no shared CSS/JS.
- Per-page inline `<style>` blocks are common (pricing page uses `.p-*` classes, product/shop pages have full cart drawer CSS inlined).
- API endpoints: `submit-quiz`, `submit-email`, `submit-chs-application` are public + rate-limited via Redis INCR. Everything under `/api/dashboard/*` requires admin session cookie; everything under `/api/client/*` requires client session cookie.

## Focus-area heuristics

### Functional
- Recent shop/Shopify integration commits are a fertile area — multiple "fix" commits in last 14 days suggest active iteration.
- Compare same-purpose markup across pages (nav, mobile menu, footer) — copy-paste drift is common and after a refactor that adds a Tools dropdown, only one page may have been updated.
- CSS Grid with `grid-template-columns: 1fr 1fr` and 3 direct children is a common layout footgun.
- Look for `?v=N` cache buster mismatches between pages loading the same JS/CSS file.

### Already-checked-clean (don't re-flag unless code changes)
- Shopify Storefront access tokens in `js/shop.js` are intentionally public (per Shopify docs they're scoped, public, browser-safe). Not a leaked secret.
- The `<a href="#" class="nav-dropdown-toggle">` is handled by `main.js` with preventDefault — not a dead link.
- All CSS variables referenced from `product.html` inline styles (`--color-bg-card`, `--color-text-muted-light`, etc.) ARE defined in `style.css`. Don't flag as undefined.
- `cleanUrls: true` in `vercel.json` means hrefs without `.html` resolve correctly. Don't flag missing extensions.
- `submit-quiz.js` has rate-limiting, IP capture, validation. Looks solid.

## False-positive patterns to avoid

- Don't flag Shopify Storefront API token as exposed (public by design).
- Don't flag `href="#"` on dropdown toggles (handled in JS).
- Don't flag clean-URL hrefs (e.g. `href="chs"` not `href="chs.html"`) as broken — Vercel `cleanUrls` resolves them.

## Areas not yet explored

- `js/main.js` scroll animation / tilt / cursor effects — performance focus day.
- `api/client/*` endpoints — auth + input validation in depth.
- Blog HTML — schema.org markup correctness.
- `client-dashboard.html` (278KB inline) — accessibility audit, large surface.
- `thomas.html` (161KB inline) — accessibility, admin auth boundary.
- Service worker cache version vs assets actually changed.
- Lighthouse / bundle size for `client-dashboard.html` (very large).

## Notes on schema

`docs/BUG_REPORT_SCHEMA.md` referenced in the agent prompt does not exist in the repo. Reports use a clear, consistent in-house structure documented at the top of each report file. If a real schema is added later, conform to it.
