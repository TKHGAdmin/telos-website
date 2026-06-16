# Bug Hunter Learnings

Living notes accumulated across runs. Patterns, false-positive traps, and codebase context.

## Codebase shape (initial pass — 2026-06-16)

- Pure HTML/CSS/JS, no build step. All API endpoints are Vercel serverless functions under `/api`.
- Two auth systems:
  - **Admin** (`api/lib/auth.js`): cookie `telos_dash_session`, HMAC-signed `{expiry}.{sig}` token. SameSite=Strict.
  - **Client** (`api/lib/client-auth.js`): cookie `telos_client_session`, `{clientId}.{expiry}.{sig}` token. PBKDF2 100k iterations. SameSite=None; Partitioned (for Whop iframe).
- Two timing-safe primitives in use: `crypto.timingSafeEqual` (client-auth) vs raw `!==` (admin auth). Inconsistency worth tracking.
- Submit endpoints (`/api/submit-quiz`, `/api/submit-email`, `/api/submit-chs-application`) all rate-limit by IP via Redis INCR/EXPIRE. Pattern is consistent.
- Login endpoints (`/api/dashboard/login`, `/api/client/login`) do NOT have rate limiting. Notable asymmetry.
- Admin dashboard (`thomas.html`) renders user-controlled strings via `innerHTML` but consistently wraps them with the `esc()` helper at line 731 (textNode → innerHTML). Quote characters are NOT escaped — relevant if escaped strings ever appear inside `onclick="..."` literals.
- Shopify Storefront Access Token in `js/shop.js` is intentionally public (storefront API). NOT a secret leak — do not re-report.

## False-positive traps to avoid

- `SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js:15` — public-by-design Shopify token. Distinct from Admin API tokens.
- `cleanUrls: true` in `vercel.json` rewrites `/foo` → `/foo.html`. Internal links without `.html` are intentional, not broken.
- `todayStr()` UTC timezone bug in client dashboard is documented in `CLAUDE.md` known-limitations backlog — don't re-flag without new evidence.
- Tool pages missing `main.js` is in the documented P1-P3 backlog (commit 7fa38ff plan file) — don't re-flag.
- SW cache version bump needed is in the backlog — don't re-flag.

## Open patterns to watch in future runs

- Login error messages reveal account state. Confirm whether the admin or coach considers this an acceptable tradeoff before re-flagging variants.
- @vercel/blob is pinned at `^0.27.0`. Major bump to 2.x is breaking; flag once, then track whether it gets resolved.
- All client portal endpoints derive `clientId` from the session (good). Watch for any new endpoint that takes `clientId` from query/body instead — that would be IDOR.
- Admin-only endpoints in `api/client/` (e.g., `notify.js`, `send-email.js`) use `verifySession` (admin), not `verifyClientSession`. Confusing path but intentional. Don't flag as misuse without verifying.

## Run log

- 2026-06-16 (security): first run; bootstrapped agent/ infra; 4 findings reported (P1 login rate limiting, P2 email enumeration, P2 undici CVE, P3 non-timing-safe HMAC compare).
