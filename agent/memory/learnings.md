# Telos Bug Hunter - Learnings

Accumulated knowledge across runs. Kept under 2000 lines.

## Bootstrap - 2026-09-13

First run. Agent infrastructure did not exist prior to this run - directories `agent/memory/`, `agent/reports/`, and `docs/BUG_REPORT_SCHEMA.md` were all missing. Created minimum scaffolding to operate. Thomas should be notified so the schema and rotation defaults can be reviewed and locked in.

## Codebase orientation

- Pure static HTML/CSS/JS site + Vercel serverless functions in `/api`.
- `main.js` is loaded on public marketing pages (not tool pages, not dashboards). Tool pages (protein-calculator, hyrox-predictor) intentionally use inline hamburger handlers per CLAUDE.md; this is not a bug even though `main.js` is absent there.
- Public POST endpoints follow a consistent pattern with `INCR/EXPIRE` rate limiting keyed to `x-forwarded-for` IP (see `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`).
- Admin auth: HMAC-signed cookie, timing-safe password comparison (`api/lib/auth.js`).
- Client auth: PBKDF2 (100k iterations, SHA-512) hash+salt, timing-safe verify, HMAC-signed session token (`api/lib/client-auth.js`).
- Service worker `sw.js` is registered from `client-dashboard.html` only, but its scope is `/` so it intercepts all subsequent requests on the origin.

## Known false-positive patterns (do not report)

- `protein-calculator.html` / `hyrox-predictor.html` missing `main.js` - documented in CLAUDE.md as intentional; both have inline hamburger handlers.
- Shopify Storefront token in `js/shop.js` is a Storefront API token which is designed to be public - not a leaked secret.
- Distinct login error messages sometimes ARE intentional UX. Only report as a bug when combined with a lack of rate limiting (as in this run).

## Patterns worth flagging in future runs

- Any new public API endpoint added under `/api/` that lacks the `ratelimit:*:{ip}` INCR/EXPIRE pattern used elsewhere.
- Any inline concat into `innerHTML` or `onclick=` that inserts a URL / attribute value without escaping (see `js/shop.js` product image handling for example patterns to watch).
- New pages that reference `js/main.js` or `css/style.css` without the shared version query (`?v=N`).
