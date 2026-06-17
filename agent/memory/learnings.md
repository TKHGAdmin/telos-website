# Bug Hunter Learnings

Accumulated knowledge across daily runs. Append new entries dated. Compress older entries when the file exceeds 2000 lines.

---

## 2026-06-17 — first run

### Codebase orientation

- Vercel project with `cleanUrls: true`. `.html` suffixes in internal `href`s still resolve (Vercel issues a 308 to the clean URL). Do NOT report bare `.html` suffixes as P1 navigation breakage — they work, they just take an extra hop. Only worth flagging as P3 if a link points to a deleted file.
- Shopify **Storefront API access tokens** are designed for client-side use. The token in `js/shop.js` is not a leaked secret. Do not flag Storefront tokens as a security issue. (Admin API tokens are a different story — those must stay server-side.)
- Quiz and email-capture forms intentionally use `fetch().catch(() => {})` per `CLAUDE.md` ("non-blocking, silent fail"). Do not flag this as a bug; it's an explicit product decision.
- Cron endpoints (`/api/cron/*`) require a `Bearer ${CRON_SECRET}` auth header and fail closed if either the env var or header is missing. This is correct; do not flag.
- All API endpoints under `/api/dashboard/` must call `verifySession(req)`, and `/api/client/` must call `verifyClientSession(req)`. Worth spot-checking new endpoints.
- CSS cache-buster is currently consistent at `?v=16` across all 32 public HTML files. JS cache-busters are per-file and should match across pages that reference the same script.
- `thomas.html` and `client-dashboard.html` are self-contained — they do NOT load `js/main.js` or `css/style.css`. Don't expect shared CSS classes or nav scripts to work there.

### False-positive patterns to avoid

- Shopify Storefront tokens in `js/shop.js` (not a secret).
- `.html` extensions in `href`s (work via cleanUrls redirect, just slightly slower).
- Quiz/email-capture silent failures (intentional per CLAUDE.md).
- Missing env-var validation at module load when the downstream call (`createHmac`, `fetch`) already fails closed on undefined.
- `parseFloat(x) || null` losing legitimate `0` values when `0` isn't a meaningful value in the domain (e.g., bodyweight).

### Genuine bug patterns spotted today

- A single shared JS file driving two pages with different DOM IDs: error/empty-state helper hardcodes one page's IDs, leaving the other page stuck on a loading state if the SDK fails. (See `js/shop.js` `showEmpty()` only targeting shop-page IDs.)
- Cache-buster version drift between sibling pages that include the same script (`shop.html` had `?v=1`, `product.html` had `?v=2`). Anytime a JS file gets a new version, every page that includes it must be bumped together.
- Password check via `crypto.timingSafeEqual` of two empty buffers returns `true`. If the credential env var is ever unset, the comparison succeeds and an empty submitted password authenticates. Always early-return when the expected secret is empty/unset.

### Areas explored

- `/api/lib/auth.js`, `/api/lib/client-auth.js`, `/api/lib/redis.js`
- `/api/submit-quiz.js`, `/api/submit-chs-application.js`, `/api/submit-email.js`
- `/api/client/daily-log.js`
- `/api/cron/engagement-check.js`
- `/js/shop.js` and the shop.html / product.html integration surface
- `vercel.json` routing config
- CSS cache-buster consistency across the 32 public HTML files

### Areas NOT yet explored (queue for future runs)

- `/api/dashboard/*` endpoints (full CRUD audit, especially `client-portal.js`)
- `/api/client/*` beyond `daily-log.js` (training-log, nutrition-log, 545)
- Cron `weekly-summary.js` content + rendering
- `client-dashboard.html` inline JS (FAB modals, training rest timer, food search)
- `thomas.html` inline JS (10 tabs)
- Service worker `sw.js` (cache version, push notification handling)
- Blog post SEO metadata correctness (Schema.org JSON-LD shape)
