# Telos Bug Hunter — Accumulated Learnings

This file persists across runs. Append new patterns at the bottom; compress older
entries into a summary when this exceeds ~2000 lines.

## Codebase orientation

- Pure HTML/CSS/JS, no build step. Vercel static + serverless (`/api`).
- Shared marketing pages load `css/style.css?v=N` and `js/main.js`. Dashboards
  (`thomas.html`, `client-dashboard.html`) are **self-contained** — do NOT touch
  shared CSS/JS expecting it to propagate to those pages.
- Shopify Buy SDK powers the shop. `shop.js` is loaded by `shop.html` and
  `product.html`; both pages embed their own copy of the cart-drawer markup
  and CSS. When shop layouts change, check both files.
- `chs.html` uses `.chs-page` scoped styles; nav DOM matches the rest of the
  site but is visually overridden. Don't flag its minimal nav (no Shop link,
  no Tools dropdown) as an inconsistency — it's intentional.
- Quiz, email captures, and CHS apps POST to `/api/submit-*` — rate-limited
  per IP via Upstash Redis `INCR` + `EXPIRE`.

## False-positive patterns to avoid

- The shop CSP / outbound CORS errors when running WebFetch from the sandbox
  are environmental, NOT product bugs.
- `descriptionHtml` is rendered into the DOM with `.innerHTML` — this is
  intentional (Shopify-admin content is trusted) and matches Shopify's own
  SDK guidance. Don't flag as XSS unless content comes from an untrusted
  source.
- `cartBadge` (desktop) and `cartBadgeMobile` (mobile) share a `.cart-badge`
  class so a single `querySelectorAll` updates both — not a duplicate-ID bug.

## Known-shipped layout & UX bugs (open)

- [2026-06-18, P1] product.html grid mismatch: `#productThumbs` is a direct
  child of the 2-col `.product-detail` grid, landing in the info column on
  desktop. See `agent/reports/2026-06-18.md`.

## Open questions for future runs

- No `docs/BUG_REPORT_SCHEMA.md` exists in the repo despite being referenced
  by the agent system prompt. Until one is committed, follow the structure
  used by the 2026-06-18 report (Frontmatter + per-bug sections with
  ID/Severity/Area/Repro/Evidence/Recommended fix).
- No `package.json` linters/tests configured. `npm test` will fail; static
  analysis must be done by reading.

## Codebase areas explored

- 2026-06-18: shop.js, product.html, shop.html, api/submit-*, api/lib/redis.js,
  cross-page nav consistency for "Shop" link.
