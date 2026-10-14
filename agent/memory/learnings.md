# Telos Bug Hunter - Learnings

Running log of codebase patterns, false-positive filters, and recurring findings. Keep under 2000 lines.

## Codebase shape

- Pure HTML/CSS/JS, no build step. Static site + Vercel serverless functions in `/api`.
- Admin and client auth live in separate modules: `api/lib/auth.js` (admin, single shared password, `telos_dash_session` cookie, 2-part token) and `api/lib/client-auth.js` (per-client PBKDF2, `telos_client_session` cookie, 3-part token).
- Dashboard admin surface is `/thomas` (self-contained HTML, inline JS/CSS). Client portal is `/client-dashboard` (same pattern, PWA).
- All sensitive endpoints under `api/dashboard/*` call `verifySession` from `lib/auth`. All client endpoints under `api/client/*` call `verifyClientSession` from `lib/client-auth`. Login/logout are the only exceptions.
- Rate limiting is implemented ad-hoc per endpoint using `INCR` + `EXPIRE` in Redis, keyed on client-supplied `x-forwarded-for`.
- Email delivery via Resend; push notifications via Web Push with VAPID (currently gated behind env var presence).

## False-positive filters

- **Shopify Storefront access token in `js/shop.js`** is a *public* credential by design (Storefront API). Do not report it as an exposed secret.
- **`document.createTextNode` + `.innerHTML` ("esc" helper) in `client-dashboard.html`** does not escape quotes, but all call sites either (a) place output in element text content, or (b) place output in HTML-attribute values where the dynamic value is a server-generated id with no quote chars. No reachable XSS from `esc` alone.
- **Custom side-menu panel content rendered via `innerHTML` on `client-dashboard.html:2749`** is intentionally admin-authored HTML. Admin is the trusted principal here; not an XSS vector unless the admin surface itself is compromised.
- **Admin password length leak in `api/lib/auth.js:verifyPassword`** - the early length check leaks the admin password length, but there is one shared admin password that Thomas controls, so impact is near zero. Not worth repeated flagging.

## Recurring themes (watch for more instances)

- **Trust in `x-forwarded-for`.** Three submit endpoints key rate limits on the raw header. Any new public endpoint that adds rate limiting is likely to copy this pattern. When writing a Vercel-specific fix recommendation, remember Vercel sets `x-vercel-forwarded-for` with the real client IP.
- **Divergent crypto patterns between `auth.js` and `client-auth.js`.** The client-auth module uses `timingSafeEqual` correctly in every HMAC/password compare; the older admin auth module uses `!==` for the session signature. New auth-adjacent code should import from `client-auth.js` for the correct pattern, not `auth.js`.
- **Inconsistent login error messages.** `/api/client/login` differentiates failure modes in response text (portal disabled vs no password set vs invalid credentials), enabling email enumeration. `/api/client/reset-password` already follows the "always return success" pattern - mirror that in login.

## Patterns to probe next

- Visual/UX rotation: check `/client-dashboard` and `/thomas` on narrow viewports; the inline CSS is substantial and may have unresponsive sections.
- Performance rotation: `thomas.html` is 161 KB and `client-dashboard.html` is 278 KB of mostly inline JS/CSS; worth measuring parse/eval cost on cold mobile loads.
- Functional rotation: `api/client/daily-log.js` accepts arbitrary-length `notes` string with no length cap - could grow Redis values unboundedly. Investigate other POST handlers for the same.
