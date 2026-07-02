# Bug Hunter — Accumulated Learnings

## Codebase overview
- Pure static HTML/CSS/JS + Vercel serverless functions.
- Two dashboards (`thomas.html`, `client-dashboard.html`) are self-contained — do NOT load `js/main.js` or `css/style.css`.
- Shop pages (`shop.html`, `product.html`) use Shopify Buy SDK v3 via `js/shop.js`.
- API auth split into two: admin (`api/lib/auth.js`, cookie `telos_dash_session`) and client (`api/lib/client-auth.js`, cookie `telos_client_session`).
- Client dashboard reset password sends first-name via string concatenation into HTML — coach-controlled name, so low XSS risk.

## Known / already-documented issues (skip when found again)
- **UTC-based `todayStr()` timezone bug** in client dashboard streaks — noted in `CLAUDE.md` as an open P1-P3 backlog item. Do NOT re-report unless resolved.
- Tool pages historically missed `main.js` — noted in `CLAUDE.md` backlog.
- Some internal links still use `.html` extensions — `cleanUrls` handles them; noted in `CLAUDE.md` backlog.
- SW cache version bump periodically needed — noted in `CLAUDE.md`.
- Whop iframe on Safari/iOS breaks client login due to third-party cookie blocking — a documented platform limitation, not a fixable bug.

## False-positive patterns to avoid
- Shopify GID variant IDs (`gid://shopify/ProductVariant/...`) contain `//` and `:` — legal inside single-quoted `onclick` attributes. Do not report as broken.
- `parseInt(x) || 0` clamping to 1 for 1-5 scale fields is intentional.
- Coach-controlled admin content rendered as HTML (client names, plan text) is trusted input by design — flag only if the surface is user-writable.

## Newly explored areas
- 2026-07-02: `js/shop.js`, `product.html`, `shop.html`, `api/client/reset-password.js`, `api/cron/engagement-check.js`, `api/lib/client-auth.js`, `api/lib/redis.js`.

## Patterns worth remembering
- The Shop stack was rapidly iterated over ~7 commits in May-June 2026 (`c1e3162` → `f5cb8c4`). Recent-diff area with highest bug density; check first on functional-focus days.
- CSS grid on `.product-detail` has hard column count of 2 but the DOM has 3 children after the gallery commit — the sort of thing that recurs when a template gains a new element without updating its container layout.
