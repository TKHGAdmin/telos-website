# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Kept under 2000 lines; older entries get compressed.

## Codebase orientation notes

- **Stack**: pure HTML/CSS/JS, no build step. Vercel static + serverless functions. Upstash Redis for data. Deployed to www.telosathleticclub.com.
- **Two auth systems**: admin (`api/lib/auth.js`, cookie `telos_dash_session`, SameSite=Strict) and client (`api/lib/client-auth.js`, cookie `telos_client_session`, SameSite=None; Partitioned for Whop iframe). They share `SESSION_SECRET` but derive tokens differently — admin token is `{expires}.{sig}` (2 parts), client token is `{clientId}.{expires}.{sig}` (3 parts).
- **CLAUDE.md documents a "Bug crawl P1-P3 backlog" from April 2026** (commit 7fa38ff plan file). Known remaining items:
  - Tool pages missing `main.js` (protein-calculator, hyrox-predictor) — CONFIRMED still present in 2026-07-29.
  - `.html` extensions in internal links across pages.
  - `todayStr()` UTC timezone bug in client dashboard streaks.
  - SW cache version bump needed (`telos-v1` in `sw.js`).
  - **Do NOT re-report these unless status is documented as changed.**
- **CSS cache-busting version is `?v=16`** on all pages; bump when style.css changes.
- **Shop pages** (`shop.html`, `product.html`) both load `js/shop.js` but with different `?v=` query strings. Version drift risk when updating.
- **thomas.html and client-dashboard.html are self-contained** (inline CSS + JS). Do NOT expect them to load shared main.js/style.css.
- **chs.html** uses a body class `chs-page` and overrides much of the shared nav CSS. Its DOM structure differs from the main site — it does NOT follow all the same nav conventions.

## API endpoint patterns

- **Public submit endpoints** (`submit-quiz`, `submit-email`, `submit-chs-application`) rate-limit on `x-forwarded-for` header. Note: Vercel's XFF is a comma-separated proxy chain, but that's acceptable for rate limiting (unique-enough key per client IP).
- **Cron endpoints** properly gate on `authorization: Bearer $CRON_SECRET` and fail-closed if `CRON_SECRET` env is absent. Good pattern to preserve when reviewing new crons.
- **Admin dashboard endpoints** all check `verifySession(req)` first. Some use `redisPipeline` to fan out ZRANGE→GET lookups efficiently.
- **Client endpoints** all check `verifyClientSession(req)` first and derive `clientId` from the token (not from request body — good, prevents IDOR).

## Confirmed false-positive patterns (do NOT report)

- **Shopify Storefront API token exposed in `js/shop.js`** — this is intentional. Storefront tokens are public, read-only, product-scoped credentials. Not a leak.
- **`descEl.innerHTML = product.descriptionHtml` in shop.js** — this is Shopify-admin-controlled content, not user-controlled. Only a concern if the Shopify admin account is compromised. Skip.
- **`onclick="addToCart(this, '${variant.id}')"` inline handlers with interpolated Shopify IDs** — variant IDs are `gid://shopify/...` format with no quotes or angle brackets. Safe in HTML attributes.
- **`.html` extensions in `href` on some pages** — Vercel `cleanUrls: true` handles the redirect. Convention violation but functionally works.

## Patterns worth watching next time

- Look at any newly-added HTML page against the "all public pages have Client Login link" convention.
- Watch for `signature !== expected` in any HMAC verification code — should be `crypto.timingSafeEqual`.
- Cache-busting `?v=N` inconsistency between pages loading the same JS/CSS asset.

## Areas explored so far

- `/api/lib/` (auth, client-auth, redis)
- `/api/` (submit-* endpoints, cron/, dashboard/, client/)
- `js/shop.js` (full read)
- `sw.js`, `manifest.json`, `vercel.json`
- Nav structure across all root pages
- CHS landing page form + submission handler

## Areas NOT yet explored (candidates for future runs)

- `js/quiz.js` (16k) — quiz logic, execution score calculation
- `js/main.js` — nav, hamburger, scroll animations, tilt, cursor
- Individual blog pages (23 files) — SEO metadata consistency, schema.org markup
- `thomas.html` (161k) — full admin dashboard, especially newer client portal editors
- `client-dashboard.html` (278k) — the largest file, high bug surface
- `/api/dashboard/analytics.js` — Vercel API proxy
- `/api/client/reset-password.js` — email reset flow
- Blog post accessibility (alt tags, heading hierarchy)
