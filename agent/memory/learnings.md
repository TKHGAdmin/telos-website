# Bug Hunter Learnings

Accumulated patterns, false-positive avoidance rules, and areas explored. Compressed on demand once this file exceeds 2000 lines.

## Codebase map (as of first run)

- Pure static HTML/CSS/JS site on Vercel + serverless API. No build step.
- Public pages: index, pricing, shop, product, chs, protein-calculator, hyrox-predictor, resources, plus /blog/*.
- Two dashboards, both self-contained (do NOT load main.js / style.css):
  - `/thomas` — admin dashboard (10 tabs).
  - `/client-dashboard` — client PWA (5 tabs + hamburger drawer).
- API endpoints under `api/*`, `api/dashboard/*` (admin session), `api/client/*` (client session), `api/cron/*` (CRON_SECRET).
- Recently added surface: Shop (Shopify Buy SDK) + product detail page. Committed Sep 2026, most likely to contain fresh bugs.

## Patterns to watch

- **Grid children order matters.** `.product-detail` is a 2-column grid — inserting a helper element between two intended columns pushes later columns to a new row. See BUG-20260916-01.
- **Shopify GIDs contain `/`, `:`.** Never put a raw variant ID into an inline `onclick="..."` without treating it as opaque; single quotes are safe today but `escapeHtml` here only escapes `<>&`, not `"` or `'`, so any store-owner value containing a quote could break the DOM. Watch, don't yet report.
- **Storefront tokens are safe in client code by design** — do NOT flag `SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js` as an exposed secret. It is not an admin token.
- **Dashboards are self-contained** — do NOT report "missing style.css / main.js" on `thomas.html` or `client-dashboard.html`.
- **Tool pages (protein-calculator, hyrox-predictor) missing main.js** is a known P1-P3 backlog item per CLAUDE.md — do NOT re-report unless it materially changes.
- **`.animate-on-scroll.visible`** is scoped intentionally; tool pages use bare `.visible` for their result sections. Do NOT flag as inconsistent.

## Areas not yet explored

- `api/cron/*` (weekly-summary, engagement-check).
- Push notification pipeline (`sw.js`, `push-subscribe`, `notify`).
- 545 Method state machine and streak/UTC handling.
- Full walk of the 23 blog articles.
- Client dashboard training rest-timer and confetti animation logic.

## False-positive rules (learned from denials)

_(none yet — first run)_

## First-run notes

- No prior reports; no decisions.jsonl entries. This is the first hunt.
- Focus rotation started at "functional" (day 16 mod 4 = 0). Tomorrow: visual.
- Started conservative: one high-confidence P1 rather than volume.
