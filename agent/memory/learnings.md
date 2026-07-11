# Bug Hunter Learnings

Accumulated knowledge for the Telos Bug Hunter agent.

## Codebase orientation

- Pure static HTML/CSS/JS + Vercel serverless functions in `api/`. No framework, no build.
- Redis (Upstash REST) for all persistent state.
- Two auth layers:
  - `api/lib/auth.js` — admin dashboard, cookie `telos_dash_session`, HMAC-signed `expires.sig` format.
  - `api/lib/client-auth.js` — client portal, cookie `telos_client_session`, format `clientId.expires.sig`, PBKDF2 password hashing.
- Public submit endpoints: `submit-quiz`, `submit-email`, `submit-chs-application`. All rate-limited via Redis INCR.

## Known-safe patterns (do NOT report as bugs)

- **`SHOPIFY_STOREFRONT_TOKEN` hardcoded in `js/shop.js`** — Shopify Storefront API access tokens are designed to be public and shipped in browser JS. Not a leaked secret.
- **`Access-Control-Allow-Origin: *`** on public submit endpoints — intentional, these are meant to be called from any origin (and vercel.json sets it globally for `/api/submit-*`).
- **`SameSite=None; Partitioned` on client auth cookie** — intentional, required for the Whop iframe embed. Admin cookie stays `SameSite=Strict`.
- **`descriptionHtml` written to `innerHTML` in shop.js** — Shopify sanitizes on their side (strips `<script>`) and admin controls the store; treat as trusted.
- **`var` reused inside the same function scope in `reset-password.js`** — hoisted to one binding, no runtime bug, just style.
- **Push notification (`api/client/notify.js`) does not implement full RFC 8291 encryption** — code comments call this out as a known incomplete implementation with graceful VAPID-key fallback.
- **`todayStr()` UTC timezone bug in client dashboard streaks** — documented in CLAUDE.md as a known unresolved P1 backlog item; do not re-report until fixed.

## Recurring bug patterns (worth looking for)

- **X-Forwarded-For rate-limit bypass** — All public `submit-*` endpoints key rate limits off the raw `x-forwarded-for` string. On Vercel, this header can contain client-supplied prefixes; only the LAST hop is trustworthy.
- **CORS headers set on success path only** — usually redundant because `vercel.json` sets them at the edge, but worth checking on new endpoints.
- **`req.body.status` / `req.body.notes` accepted without max-length checks** except in `chs-applications.js` (notes clamped to 4000).

## Investigation shortcuts

- All admin dashboard endpoints require `verifySession(req)`. Grep `dashboard/*.js` files that DON'T call it as a first pass for missing-auth bugs.
- Client endpoints under `api/client/*` should call `verifyClientSession(req)`. Exceptions: `login.js`, `logout.js`, `reset-password.js`, `notify.js` (admin-triggered).
- Cron endpoints must gate on `req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET` and fail closed if `CRON_SECRET` is unset.

## Approval history summary

_(No decisions yet — first run 2026-07-11.)_
