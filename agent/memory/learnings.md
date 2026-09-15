# Telos Bug Hunter - Learnings

Accumulated knowledge across runs. Keep under 2000 lines; compress older entries when it grows.

---

## Bootstrap - 2026-09-15

First run. No prior reports, no `decisions.jsonl` history yet. Infrastructure (`agent/`, `docs/BUG_REPORT_SCHEMA.md`) did not exist and was created this run. Focus rotation initialized at 0 (functional).

## Repo layout notes

- Pure HTML/CSS/JS. No build step. Vercel-hosted with serverless functions under `/api/`.
- `CLAUDE.md` is the authoritative overview and lists a "Known Limitations / backlog" section - never re-report items already in that list (tool pages missing `main.js`, `.html` extensions in internal links, `todayStr()` UTC timezone bug in client dashboard streaks, service worker cache version bump).
- Two dashboards (`thomas.html`, `client-dashboard.html`) are self-contained and do NOT load `main.js` or `style.css`. Do not flag "missing main.js" on those two.
- Shop is a recent addition (`shop.html`, `product.html`, `js/shop.js`). Shopify Storefront tokens ARE intended to be public (client-side); the token in `js/shop.js:15` is not a leaked secret.
- Rate limiter uses `x-forwarded-for` which can contain a comma-separated list. Not currently a bug worth reporting (Vercel injects the client IP as the first entry) - flag only if it demonstrably lets an attacker bypass.

## False-positive patterns to avoid

- **Shopify Storefront token in client JS**: intended by design. Not a security bug.
- **Missing `.html` extensions**: `cleanUrls: true` in `vercel.json` handles both forms. Already in known-limitations backlog; do not re-report unless a page 404s.
- **CSS `?v=N` mismatch between pages**: only matters when `style.css` itself changed; per-file cache-busting versions (e.g. `js/shop.js?v=1` vs `?v=2`) are per-file and fine.
- **Session cookie SameSite=None**: intentional for Whop iframe embedding on client cookie only. Admin cookie is SameSite=Strict.

## Areas explored this run

- `js/shop.js`, `shop.html`, `product.html` - Shopify integration (new feature, still shaking out)
- `sw.js` - service worker
- `api/lib/client-auth.js`, `api/client/login.js` - client auth
- `api/submit-quiz.js` - public quiz submission endpoint
- `vercel.json`

## Findings this run (2026-09-15)

- **BUG-2026-09-15-01** (P2): 3 children in a 2-col grid on `product.html` puts the thumbnail strip in the info column - the just-shipped image gallery feature (`f5cb8c4`) missed a wrapper element.
- **BUG-2026-09-15-02** (P3): `showEmpty()` in `shop.js` is not page-aware. On `product.html`, if the SDK fails to load, both `getElementById` calls miss and the spinner spins forever.

## Patterns worth watching

- **Grid-layout regressions when new elements are inserted**: adding a DOM element in the middle of a CSS grid without adjusting `grid-template` or wrapping is an easy way to break existing layouts silently. Worth scanning for on future visual-UX days.
- **Shared helper functions that assume page identity**: `showEmpty()` was written for `shop.html` and then reused on `product.html` without adjustment. Look for similar cross-page function reuse.

## Next focus (2026-09-16)

Rotate to `visual-ux`. Good candidates for that run: mobile responsiveness of `client-dashboard.html` FAB + modals, `chs.html` typography at narrow widths, missing `alt` / `aria-*` on new shop pages, contrast of gold-on-white price-compare text.
