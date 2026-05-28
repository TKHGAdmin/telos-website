# Bug Hunter Learnings

This file accumulates patterns spotted across runs. Keep entries dated and concise. Compress when over 2000 lines.

## 2026-05-28 — Bootstrapping notes

- Repo is pure HTML/CSS/JS + Vercel serverless functions. No build step, no tests, no TypeScript. Lint via inspection only.
- `CLAUDE.md` is authoritative for project conventions but lags actual files. Recent commits added `shop.html` and `product.html` which are NOT in the project structure section — worth treating "undocumented surface area" as a smell, not a bug per se.
- Clean URLs are enabled (`vercel.json: cleanUrls: true`). Any internal link ending in `.html` is a real bug (causes redirect/404 in some configs).
- `body.page-load-anim` should only appear on `index.html`. If it shows up on other pages, they fade in on every load.
- CSS cache busting: `?v=N` on stylesheet refs. All public pages must match. Mismatched versions are a real bug.
- `main.js` must load on all public marketing pages (handles nav/hamburger). Dashboards (`thomas.html`, `client-dashboard.html`) are intentionally self-contained.
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) historically forgot `main.js` — known bug pattern per CLAUDE.md.
- Client dashboard uses inline styles only. Do NOT flag "should be moved to style.css" as a bug — that's the convention.
- Em dashes are banned project-wide. `---` and `--` in user-facing copy are real bugs (CLAUDE.md rule).

## 2026-05-28 — Functional pass

Patterns spotted:
- `quiz.js` rebinds button listeners every time `setupLeadCapture`/`renderResults` runs. Same pattern likely lurks elsewhere where a function reused as a "setup" routine attaches listeners on every call — worth a grep for `addEventListener` inside functions that are called from event chains, not just from `DOMContentLoaded`.
- `shop.js` is loaded with version suffix `?v=N`. Two pages now disagree (`shop.html` v=1, `product.html` v=2). Treat any `?v=N` suffix as a cross-page invariant — when one bumps, all should.
- New surface area landed without CLAUDE.md updates: `shop.html`, `product.html`, `js/shop.js`. Doc lag is a useful smell — undocumented new pages often have rough edges (the listener-rebind bug isn't in shop.js, but the cache-bust drift is, and the nav inconsistencies are too).
- Shopify Storefront tokens are PUBLIC by design — do NOT flag `js/shop.js:15`'s hardcoded token as a leak on security day unless the scope turns out to include admin-level operations.
- `/api/submit-email` source allow-list is closed: `['protein-calculator', 'hyrox-predictor']`. Future tool pages submitting emails will silently 400 unless added.
- Nav structure differs subtly between pages: `shop.html` highlights "Shop" in gold; `product.html` doesn't. Worth checking visual consistency tomorrow.

False-positive patterns to avoid:
- `.html` extensions in internal nav links (e.g. `index.html#about`) are already documented in CLAUDE.md's P1-P3 backlog. Don't re-report.
- Tool pages missing `main.js` is also in the backlog. Don't re-report.
- Hardcoded Shopify Storefront token is INTENDED to be public — not a secret leak.
- Inline `<style>` on dashboards / pricing / client-dashboard is intentional convention — not a "should be in style.css" bug.
- Pricing pages and client dashboard intentionally do NOT load main.js / shared CSS conventions don't apply.
