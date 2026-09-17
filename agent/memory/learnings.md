# Bug Hunter Learnings

Accumulated knowledge from daily bug hunts. Keep under 2000 lines - compress older entries when needed.

## Codebase Map

- **Static frontend**: HTML/CSS/JS, no build step. Pages: `index.html`, `pricing.html`, `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, `shop.html`, `product.html`, `thomas.html` (admin), `client-dashboard.html` (client PWA), plus 23 blog articles under `blog/`.
- **API**: Vercel serverless functions under `api/`. Three public POST endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`) with per-IP rate limiting via Redis INCR. Client-facing endpoints under `api/client/` gated by `verifyClientSession` (HMAC-signed cookie). Admin endpoints under `api/dashboard/` gated by `verifySession`.
- **Auth split**: Admin uses `telos_dash_session` cookie (2-part token, `payload.sig`, `SameSite=Strict`). Client uses `telos_client_session` (3-part token, `clientId.expiry.sig`, `SameSite=None; Partitioned` for Whop iframe support).
- **Data store**: Upstash Redis via `api/lib/redis.js` (REST client, no deps). All keys documented in `CLAUDE.md`.
- **Known issue backlog** (from `CLAUDE.md`, do NOT re-report as new): tool pages missing `main.js`, internal links with `.html` extensions, `todayStr()` UTC timezone bug in client dashboard streaks, service worker cache version bump needed, Whop iframe cookie issue on Safari/iOS.

## Patterns Noticed

### 2026-09-17 (Run #1, Functional focus)

- **Rate-limiting is inconsistent**. `submit-quiz`, `submit-email`, and `submit-chs-application` all have per-IP hourly caps (5-10 requests/hr) implemented via Redis INCR+EXPIRE. But `api/client/login.js` and `api/client/reset-password.js` — the two endpoints most likely to be brute-forced or spam-abused — have no rate limit. Worth revisiting on a security-focus day.
- **Delete flows don't cascade**. `api/dashboard/clients.js` DELETE only removes `client:{id}` and one index entry. It doesn't clean up any of the ~15 associated Redis keys documented in `CLAUDE.md` (`client_email`, `client_dailylog:*`, `client_nutrition_*`, `client_training_*`, `client_545_*`, `client_supplement_*`, `client_activity_*`, `client_sidemenu`, `client_mindset`, `client_resources`). See report 2026-09-17 for the primary reproduction.
- **Info-leak in `client/login.js` error messages**. Returns distinct errors for "Portal access not enabled" (line 37) vs "Account is not active" (line 40) vs generic "Invalid email or password" — lets an attacker enumerate valid emails. Reset-password endpoint correctly returns 200 in all "email doesn't exist" paths to avoid enumeration; the login endpoint violates the same principle. Worth reporting on a security-focus day if not fixed.
- **HMAC signature comparison in `auth.js:27` uses `!==`** (not `timingSafeEqual`). By contrast, `client-auth.js:49` uses `timingSafeEqual` on the same style of check. Style/security inconsistency worth flagging on a security day; functional impact is nil because HMAC output is unpredictable.
- **`variant.compareAtPrice.amount || variant.compareAtPrice`** patterns in `shop.js:151-152, 253-254` collapse to the whole object when `amount` is 0 or absent. Very edge-case; unlikely to fire in practice.
- **Quiz submit uses button click + `preventDefault`** (`quiz.js:225`) rather than intercepting form `submit`. In principle a user pressing Enter inside a text input could bypass the handler and cause a page reload with querystring params. In practice `preventDefault` on the synthesized click from Enter-key submission usually blocks the submit, but this varies by browser. Worth verifying in a Visual/UX pass with real form interaction.

## False-positive Patterns (do NOT report)

- The Shopify **Storefront** access token in `js/shop.js:15` is public by design (that's what Storefront tokens are for). Not a secret leak.
- The `.html` extensions in internal links (e.g., `index.html#how-it-works`) are already tracked in the P1-P3 backlog per `CLAUDE.md`. Not a new finding.
- `todayStr()` UTC timezone bug is already tracked. Do not re-report.
- Tool pages missing `main.js` is already tracked.

## New Areas Explored (Run #1)

- `api/lib/{auth,client-auth,redis}.js`
- `api/submit-{quiz,email,chs-application}.js`
- `api/client/{login,reset-password,food-search,training-log,five-four-five}.js`
- `api/dashboard/{clients,client-portal}.js`
- `api/cron/weekly-summary.js`
- `js/{shop,quiz}.js`
- `product.html` (structure + script load order)
