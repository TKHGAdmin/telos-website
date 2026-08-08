# Bug Hunter Learnings

Accumulated patterns, false-positive heuristics, and codebase notes.
Keep under 2000 lines. Compress old entries into summaries when needed.

---

## 2026-08-08 (Day 1 — bootstrap)

**Codebase notes:**
- No build step. Pure static HTML/CSS/JS with Vercel serverless functions in `api/`.
- Recent activity is heavily on the Shopify shop + product pages (commits since May 2026).
- Product detail page (`product.html`) uses inline `<style>` and calls into `js/shop.js` for Shopify Buy SDK integration.
- The site uses clean URLs (Vercel `cleanUrls: true`), so internal hrefs use `href="shop"` not `href="shop.html"`.

**False-positive patterns to avoid:**
- The Shopify Storefront API token (`SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js`) is DESIGNED to be public and appear in client-side code. It's not a leaked secret. Only Admin API tokens are sensitive.
- `descriptionHtml` from Shopify is admin-authored by Thomas — treating it as innerHTML is not a real XSS risk in this codebase.
- Independent versioning between `style.css?v=N` and `main.js?v=M` is intentional. Mismatched numbers alone are not a bug.

**Areas explored:**
- product.html (inline CSS + DOM structure)
- js/shop.js (Shopify Buy SDK integration, cart, product detail)
- js/main.js (nav, dropdowns, scroll animations)
