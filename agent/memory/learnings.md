# Telos Bug Hunter — Learnings

Accumulated knowledge about the codebase, hunting patterns, and false-positive traps. Keep this concise — it's loaded every run.

## Known backlog (do NOT re-report unless re-verified open)

CLAUDE.md documents a P1–P3 backlog from the April 2026 bug crawl that Thomas already knows about. Reporting these as new bugs is noise.

- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) do not load `js/main.js`. Confirmed still true as of 2026-06-28.
- Internal `.html` extension links across many pages (`shop.html`, `product.html`, `chs.html`, `pricing.html`, `resources.html`, blog/*, etc). Vercel `cleanUrls:true` makes these still work via redirect; documented as known.
- `todayStr()` in `client-dashboard.html` (line 1841) uses `toISOString()` → UTC. Affects PST/EST users' streak/heatmap accuracy. Known.
- Service worker `sw.js` cache name still `telos-v1` despite asset changes. Known.

## Codebase map (where things live)

- Public marketing: `index.html`, `pricing.html`, `chs.html` (in-person), `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, `shop.html`, `product.html`, `blog/*`.
- Dashboards (self-contained, no shared CSS/JS): `thomas.html` (admin), `client-dashboard.html` (client PWA).
- Shared JS: `js/main.js` (nav/scroll), `js/quiz.js` (lead quiz on index + pricing), `js/shop.js` (Shopify Buy SDK integration on shop + product).
- API: `api/lib/{auth,client-auth,redis}.js`, `api/submit-*`, `api/cron/*` (require CRON_SECRET), `api/client/*` (require client session), `api/dashboard/*` (require admin session).

## Hunting notes

- All `api/dashboard/*` and `api/client/*` endpoints reviewed on 2026-06-28 call `verifySession` / `verifyClientSession` correctly. The login/logout/reset-password endpoints intentionally don't.
- Both cron endpoints (`weekly-summary`, `engagement-check`) verify `CRON_SECRET` before doing work.
- Shopify Buy SDK is loaded sync (no `defer`/`async`) right before `js/shop.js` on both shop pages — order is fine.
- The Shopify Storefront token in `js/shop.js` (line 15) is intentional — Storefront API tokens are public, unlike Admin tokens. Do NOT flag as exposed secret.
- `everfitUrl` is still returned by `api/client/me.js` even though CLAUDE.md says Everfit was removed. Dead field, not a runtime bug.

## False-positive traps

- `.html` link suffix is not broken — Vercel `cleanUrls:true` redirects. Don't flag as P1.
- Hardcoded `SHOPIFY_STOREFRONT_TOKEN` is intended public — not a secret leak.
- `verifyClientSession` returning falsy and the handler returning early before doing work IS the auth check — don't flag handlers that pattern-match this as missing auth.

## Patterns to keep watching

- New code under `shop.html` / `product.html` / `js/shop.js` is the freshest surface area (8+ commits in the last week). Recurring "fix:" commits suggest more bugs may surface.
- Cache-busting query params (`?v=N`) are managed manually on every page that loads a shared asset. Easy to forget when bumping one page — diff every page that references the touched file.
