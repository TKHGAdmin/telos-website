# Bug Hunter Learnings

Accumulated patterns and pitfalls. Append-only with periodic compression.
Keep under 2000 lines.

## False-positive patterns to AVOID

- **Shopify Storefront Access Token in client code** is INTENTIONAL — it's
  a public, scoped token. Do not flag it as a leaked secret. (Sanity-checked
  2026-06-05 against `js/shop.js:15`.)
- **`.html` extensions on a small number of internal links** (e.g.
  `index.html#section`) — already in the documented bug-crawl backlog per
  `CLAUDE.md` ("Known Limitations → P1-P3 backlog"). Do not re-report unless
  a NEW page introduces them.
- **SW cache name `telos-v1`** — also in the documented backlog. Don't
  re-flag until a noticeable cache-staleness symptom shows up.
- **Whop iframe / Safari third-party cookies** — documented limitation in
  `CLAUDE.md`. Don't report client portal login failures inside Whop on
  iOS Safari.

## High-yield places to look on a Functional day

- `js/shop.js` + `shop.html` + `product.html` — newest code, highest churn.
- `js/quiz.js` — long-lived but the retake flow is complex (multiple state
  resets, lots of inline `addEventListener` calls).
- `/api/submit-*.js` — public, unauthenticated endpoints; check rate-limit
  + validation invariants.
- `/api/lib/auth.js` — session signing logic; check for non-timing-safe
  string comparisons of HMAC outputs.

## Patterns observed

- The project intentionally has NO build step (pure HTML/CSS/JS), so any
  pattern that assumes Webpack/Vite/TS will be wrong.
- Dashboards (`thomas.html`, `client-dashboard.html`) are SELF-CONTAINED.
  Do NOT report "missing main.js" on those pages — by design.
- Pricing CSS lives inline in `pricing.html` only. Don't expect to find
  `.p-card` etc. in `style.css`.
- Clean URLs are on (`vercel.json`). Internal links of the form `chs`,
  `pricing`, `protein-calculator` are correct, not bugs.
- Recent feature additions (last ~5 commits) added: shop/cart, product
  detail page, image gallery with thumbnails. These are the freshest
  surfaces.

## Run log

- **2026-06-05** — First run. Focus: Functional. Found 1 P1 (broken
  product-detail grid layout in `product.html` introduced by the recent
  image-gallery feature) and 1 P2 (quiz retake leaks duplicate submit
  listeners in `js/quiz.js`, producing duplicate lead submissions on
  every retake). Bootstrapped `agent/` and `docs/BUG_REPORT_SCHEMA.md`.
