# Bug Hunter Learnings

Accumulated knowledge about the Telos codebase, false-positive patterns, and heuristics for future runs. Kept under 2000 lines; oldest entries compressed into summaries as the file grows.

## Codebase overview (as of first run — 2026-07-17)

- Pure static HTML/CSS/JS site on Vercel + Upstash Redis via serverless functions.
- Public pages: `index.html`, `pricing.html`, `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, `shop.html`, `product.html`, and 23 blog articles under `blog/`.
- Two protected dashboards, both self-contained (do NOT load `main.js` or `css/style.css`): `thomas.html` (admin) and `client-dashboard.html` (PWA client portal).
- Recently added and undocumented in CLAUDE.md: `shop.html`, `product.html`, `js/shop.js` — Shopify Buy SDK v3 integration.
- Auth libs: `api/lib/auth.js` (admin, HMAC session cookie), `api/lib/client-auth.js` (client, PBKDF2 + HMAC token).
- Storage: Upstash Redis via a thin REST wrapper in `api/lib/redis.js`.

## Confirmed patterns worth investigating on future runs

- **Public form endpoints** — `api/submit-*.js` all have their own IP rate-limit keys but validation strictness varies. Cross-check them for consistency each run.
- **Auth constant-time comparisons** — `client-auth.js` uses `crypto.timingSafeEqual` for HMAC verification; `auth.js` (admin) does not. The rest of the auth surface is worth re-auditing whenever either file changes.
- **CLAUDE.md conventions worth linting for**:
  - Internal links should be extension-less (`href="pricing"`, not `href="pricing.html"`).
  - No em-dashes (`--`, `---`).
  - `main.js` loaded on every public marketing page but never on dashboards.
  - CSS version bump (`?v=N`) on all pages when `css/style.css` changes.
- **Shopify Storefront token in `js/shop.js`** — this token is designed by Shopify to be public and used from the browser. Do NOT flag it as a leaked secret unless it looks like an Admin API token (which would start with `shpat_`).

## Known limitations already documented in CLAUDE.md

Skip these — they're already in the P1-P3 backlog (commit 7fa38ff), not fresh findings:

- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) missing `main.js`.
- Internal links using `.html` extensions instead of clean URLs.
- `todayStr()` UTC timezone bug in client dashboard streaks.
- SW cache version bump needed for `sw.js`.
- Whop iframe cookie limitations on Safari/iOS.

If the backlog gets cleared, re-check these before re-reporting.

## False-positive patterns to avoid

- Shopify Storefront Access Tokens are public by design — not a secret leak.
- `.html` internal links: convention violation but already known — do not report.
- Missing main.js on tool pages: already known — do not report.
- `Access-Control-Allow-Origin: *` on public submit endpoints: intentional per CORS design for the widget/embed use case.

## Focus-area heuristics

- **Functional**: highest signal on newly-added pages/endpoints. Trace critical user paths (checkout, signup, quiz, application form).
- **Visual/UX**: fetch live URLs; inspect breakpoints at 320/375/768/1024/1440.
- **Performance**: `du -sh images/` and grep for unoptimized image formats; look for render-blocking scripts in `<head>`.
- **Security**: `npm audit` (though `package.json` only has one dep); grep for `eval(`, `innerHTML =` with untrusted source, missing auth on `api/dashboard/*` and `api/client/*`.
