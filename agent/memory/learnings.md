# Telos Bug Hunter - Accumulated Learnings

## Bootstrapping notes (2026-09-22)

This is the first run. No prior reports or decisions exist yet.

The framework references `docs/BUG_REPORT_SCHEMA.md` but the file does not exist in the repo. Since the agent's write scope is limited to `agent/memory/` and `agent/reports/`, the schema cannot be created in `docs/`. Reports use a sensible schema (yaml front matter + one section per finding) that a parser can be built around. If Thomas wants a strict machine-readable schema, this convention can be codified later.

## Codebase orientation

- Pure HTML/CSS/JS static site + Node serverless functions on Vercel.
- Upstash Redis is the sole datastore. All Redis access is REST (via `api/lib/redis.js`), so no npm client bugs.
- Two auth systems: admin (`api/lib/auth.js`, cookie `telos_dash_session`, HMAC-signed) and client (`api/lib/client-auth.js`, cookie `telos_client_session`, PBKDF2 + HMAC-signed).
- **Inconsistency:** client-auth uses `crypto.timingSafeEqual` for the HMAC signature check; admin auth uses `!==`. Same repo, same author, same threat model - so the difference is worth flagging.
- Two Vercel Cron jobs live under `api/cron/`. Both require `CRON_SECRET` and fail closed if missing. They are the only place the site "does something" without user action - watch them closely for correctness bugs.
- Client dashboard (client-dashboard.html) is a single ~5000-line self-contained HTML/JS file. Uses `todayStr()` = `new Date().toISOString().split('T')[0]` throughout, which is UTC-based and known to break late-evening logging in US timezones (CLAUDE.md acknowledges this as a P1-P3 backlog item, so do NOT re-report).
- CLAUDE.md sets several conventions worth checking against:
  - Clean URLs (no `.html` in internal hrefs) - many pages still use `href="index.html"`.
  - CSS cache-buster `?v=N` must be bumped on every style.css change - currently `?v=16` everywhere.
  - `main.js` loads on public pages only, not on `thomas.html` / `client-dashboard.html`.

## False-positive patterns to avoid

- **Shopify Storefront Access Token in `js/shop.js`** looks like a leaked secret but is DESIGNED to be public. Shopify's Storefront API access token is read-only and intended for browser-side use. Do not flag.
- **HTML-injection-style findings via Shopify product data** (product.descriptionHtml, image src) are only exploitable if the Shopify admin is compromised. Low priority unless the coach adds untrusted users to Shopify.
- **Missing `crypto.timingSafeEqual` in HMAC verification** is a legitimate best-practice finding but rarely exploitable over the network. Flag once, then let it rest unless the same file grows a new attack surface.
- **UTC `todayStr()` timezone bug in client-dashboard.html** is acknowledged in CLAUDE.md's Known Limitations. Do not re-report.

## Patterns noticed

- Admin endpoints universally do `verifySession(req)` at the top and 401 on failure. Consistent, good.
- Client endpoints universally do `verifyClientSession(req)` and 401 on failure. Consistent, good.
- All Redis JSON.parse calls are wrapped in try/catch, so malformed data won't crash a handler.
- All public forms have rate limiting via `ratelimit:*` INCR+EXPIRE Redis keys - except `reset-password.js`, which is the outlier.
- Email templates in `send-email.js` and `reset-password.js` build HTML by string concatenation with client name inserted unescaped (`(client.name || '').split(' ')[0]`). The names are set by the coach in the admin panel so the risk is low, but any name containing HTML special chars would break the template. Flag only if the coach ever imports client names from an external source.

## Focus rotation

Bootstrapped rotation: index 0 = Functional, 1 = Visual/UX, 2 = Performance, 3 = Security. Today (2026-09-22) is Functional. `focus-rotation.json` advances the index by 1 each day.

## New areas explored (2026-09-22, first run)

- All API endpoints under `api/`
- Auth library files (`api/lib/auth.js`, `api/lib/client-auth.js`)
- Cron jobs (`api/cron/`)
- Client dashboard date handling and streak logic
- Static HTML nav links across all public pages
