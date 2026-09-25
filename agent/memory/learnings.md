# Bug Hunter Learnings

Accumulated patterns, false positives to avoid, and areas explored.

## Bootstrap run — 2026-09-25

First run of the agent. No prior reports, no prior decisions. Created initial directory
structure (`agent/memory/`, `agent/reports/`) and the report schema at
`docs/BUG_REPORT_SCHEMA.md`.

## Known bug backlog (per CLAUDE.md, do NOT re-report as new)

The April 2026 bug crawl (commit `7fa38ff`) documented these unresolved items — they
belong to Thomas's known backlog, not new findings:

- Tool pages missing `js/main.js` (protein-calculator, hyrox-predictor)
- `.html` extensions still present in some internal links
- `todayStr()` UTC timezone bug in client dashboard streaks (`client-dashboard.html:1840`)
- Service worker cache version needs bumping (`sw.js`, `cache: 'telos-v1'`)

Do not re-flag these unless the plan file is closed AND the issue reproduces.

## False-positive patterns to skip

- **`SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js`.** Shopify Storefront API tokens are
  designed for client-side use (read-only, rate-limited). Not a leaked secret.
- **Password `<input>` placeholders.** Common false-positive when grepping for the word
  "password". Skip anything inside `placeholder=` or `autocomplete=` attributes.
- **`.html` extensions in internal links.** Known backlog (see above).

## Areas explored

- `product.html`, `js/shop.js` — recent commits added image gallery and add-to-cart on
  the product detail page.
- `shop.html` — mirror of product detail cart drawer.
- `api/submit-quiz.js`, `api/submit-chs-application.js` — public endpoints look solid
  (rate limiting, validation, sanitization all in place).
- `api/lib/` — three files: `auth.js`, `client-auth.js`, `redis.js`. CLAUDE.md matches.
- Date-string usage — 13 sites use `new Date().toISOString().split('T')[0]`. Client
  dashboard uses `todayStr()` helper. Timezone bug is on the known backlog.

## Patterns worth watching next time

- Every time a new sibling is added to a CSS grid parent, verify the grid template
  column/row count still matches the new child count. Product detail page grid was
  authored for 2 children, then a 3rd (thumbs) was inserted — the desktop layout broke
  silently because mobile falls back to 1fr.
- Recently-added features (last 7 days of commits) are the highest-yield area to hunt.
  Old code has been trafficked by real users; new code hasn't.
