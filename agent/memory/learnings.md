# Telos Bug Hunter — Learnings

Running notes the agent accumulates between runs. Keep under 2000 lines; compress older entries if it grows beyond that.

## Codebase shape

- Static site: HTML/CSS/JS, no build step. Served by Vercel.
- Serverless API under `api/`. Admin endpoints under `api/dashboard/*` (session cookie `telos_dash_session`, verified by `verifySession` in `api/lib/auth.js`). Client endpoints under `api/client/*` (session cookie `telos_client_session`, verified by `verifyClientSession` in `api/lib/client-auth.js`).
- Admin dashboard is `thomas.html` — self-contained, inline CSS/JS, does NOT load `js/main.js` or `css/style.css`.
- Client PWA is `client-dashboard.html` — same self-contained pattern.
- Data store: Upstash Redis via the REST client in `api/lib/redis.js`.
- All submit endpoints share the same rate-limit pattern: `INCR ratelimit:<kind>:<ip>` keyed off the raw `x-forwarded-for` header.
- `esc()` helper (defined inline in both dashboards) is the standard HTML-escape. Attribute-context values that end up inside an inline-event handler need JS-string escaping too, which `esc()` doesn't do.

## Session model notes

- Admin token = `expires.hmac(expires)`. Signed only with `SESSION_SECRET`.
- Client token = `clientId.expires.hmac(clientId.expires)`. Signed only with `SESSION_SECRET`.
- Neither token carries a password version or jti, so a password reset can't invalidate existing tokens. 7-day cookie lifetime.
- Client cookie is `SameSite=None; Partitioned` to work in Whop iframe. Admin cookie is `SameSite=Strict`.

## Rate-limit pattern (shared gotcha)

- All `api/submit-*` endpoints and nothing else use rate limiting.
- The IP key is `req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'`. Vercel appends to `X-Forwarded-For` rather than overwriting it, so an attacker-controlled prefix becomes part of the key. Each request can rotate the prefix to generate a fresh bucket.
- Login (`api/dashboard/login.js`, `api/client/login.js`) and `api/client/reset-password.js` do NOT rate-limit at all.

## Admin dashboard rendering quirks

- `thomas.html` builds table rows by string concatenation and sets `innerHTML`. User-supplied text goes through `esc()` for text contexts, but inline event handlers (`onclick="..."`) need separate JS-string escaping — `esc()` by itself is not safe for that context, because browsers decode HTML entities before the JS parser sees the attribute value.
- There's one known-dead pattern at `thomas.html:2528`: `JSON.stringify(JSON.stringify(s))` embedded directly inside a double-quoted `onclick=` attribute. The outer stringify emits literal `"` characters that terminate the attribute. Confirmed broken via Chromium — "Unexpected end of input" on click. See report `2026-10-07.md`.

## Shopify shop

- `js/shop.js` renders product fields with mixed escaping. Product `descriptionHtml` is intentionally rendered as raw HTML (admin wants rich text); image `src` is interpolated without quoting. Shopify-controlled surface, lower risk, but a pattern to watch if non-admin editors ever get Shopify access.

## Known false-positive patterns (don't re-report)

(Empty on day 1. Populate from denials in `decisions.jsonl`.)

## Areas explored

- 2026-10-07: `api/lib/{auth,client-auth,redis}.js`, all admin endpoints, most client endpoints, `thomas.html` rendering of submissions/clients, `client-dashboard.html` innerHTML sites, `js/shop.js`, `vercel.json`.
