# Bug Hunter Learnings

Accumulated knowledge about the Telos Fitness codebase and hunt patterns.
Compressed periodically. Keep under 2000 lines.

## Codebase map

- No build step. Every page is a raw HTML file at repo root. Shared styles in
  `css/style.css` (version-bumped via `?v=N` query). Shared JS in `js/main.js`.
- Two dashboards (`thomas.html`, `client-dashboard.html`) are self-contained -
  all CSS/JS inline. They do not load `main.js` or `style.css`. Bugs in shared
  files never affect them, and vice versa.
- All APIs are Vercel serverless functions in `/api`. Data lives in Upstash
  Redis. There is no ORM - keys are documented in CLAUDE.md.
- Recent-work hotspot as of 2026-07-03: `shop.html`, `product.html`,
  `js/shop.js` (Shopify Buy SDK integration, added May 2026).

## High-value hunt targets

- **Recent commits.** New code is where new bugs live. `git log --oneline -20`
  before every hunt.
- **Grid/flex layouts with a variable number of children.** Adding a child to
  a `grid-template-columns: 1fr 1fr` parent shifts everything - easy to break
  on desktop while looking fine on mobile.
- **Redis key composition.** Any string interpolated into a key
  (`client:${id}`) is a boundary. If IDs can contain the separator character,
  parsing breaks.
- **Cookie / auth token parsing.** Delimiter mismatch or non-timing-safe
  compare = P0.
- **Rate-limit keys derived from headers.** `x-forwarded-for` can be a
  comma-separated list on Vercel. Not a bug on Vercel (they normalize), but
  worth watching if that changes.

## Known-safe patterns (do NOT report as bugs)

- The Shopify Storefront token in `js/shop.js` is public by design. Not a
  security bug.
- Client integer IDs from Redis `INCR` cannot contain `.`, so the
  `{clientId}.{expires}.{sig}` session token format is safe.
- `escapeHtml()` in `js/shop.js` uses `createTextNode` + `innerHTML` - correct
  and safe against XSS.
- `body.page-load-anim` only on `index.html` is intentional (documented in
  CLAUDE.md).
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) not loading
  `main.js` is a known P2/P3 in the P1-P3 backlog (CLAUDE.md notes it).

## False-positive patterns to avoid

- "This function could be extracted / renamed / moved." Not a bug.
- "The comment is outdated." Only report if it misleads the reader into a real
  bug.
- "Deprecated API used but still works." Only report if there is a concrete
  break coming.

## First-run notes (2026-07-03)

Bootstrapped scaffolding from scratch (no prior `agent/`, `docs/BUG_REPORT_SCHEMA.md`).
Focus 0 = Functional. Reviewed recent product/cart commits, API auth surface,
CHS submission endpoint. Full report at `agent/reports/2026-07-03.md`.
