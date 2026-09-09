# Telos Bug Hunter - Accumulated Learnings

## Codebase orientation notes

### Architecture
- Pure static HTML + JS + CSS, no framework, no build step. Vercel-hosted.
- Serverless API under `/api/**` (Node.js handlers, `module.exports = async function handler(req, res)`).
- Data lives in Upstash Redis, accessed through `api/lib/redis.js` (a thin REST wrapper - no npm deps).
- Two auth surfaces:
  - Admin dashboard (`/thomas`) - `api/lib/auth.js`, cookie `telos_dash_session`, HMAC-signed `{expires}.{sig}` token, `SameSite=Strict`.
  - Client portal (`/client-dashboard`) - `api/lib/client-auth.js`, cookie `telos_client_session`, HMAC-signed `{clientId}.{expires}.{sig}` token, `SameSite=None; Partitioned` (for Whop iframe).
- Public endpoints (`submit-quiz.js`, `submit-email.js`, `submit-chs-application.js`) all rate-limit via `ratelimit:*` Redis counter keyed on `x-forwarded-for`.

### Known backlog (from CLAUDE.md - do NOT re-report)
- `todayStr()` UTC timezone bug in client dashboard (client-dashboard.html:1840). Confirmed present.
- Tool pages missing `main.js` include.
- `.html` extensions in some internal links.
- Service worker cache name `telos-v1` needs bump when static assets change (network-first strategy means it's mostly benign).
- All four are documented on the P1-P3 backlog in commit 7fa38ff.

### Patterns worth watching
- **Rate limiting asymmetry**: public form endpoints are rate-limited, but login/reset-password on the client portal are not. This is the pattern to look for when reviewing auth endpoints.
- **`showEmpty()` in shop.js** is called from four locations - the pre-init checks and the init try/catch. It references `shopLoading` / `shopEmpty` which only exist on shop.html, not on product.html. This is the pattern behind the 2026-09-09 P2: any function that renders error state must handle both pages.
- **Timing-safe comparison inconsistency**: `client-auth.js:49` uses `crypto.timingSafeEqual` for the client HMAC, but `auth.js:27` compares the admin HMAC with `!==`. Both were written by the same author; this is the kind of small copy-paste-forward inconsistency worth checking for in future security passes.
- **Notes field length caps**: `training-log.js:54` caps `body.notes` at 1000 chars via `.slice(0, 1000)`; `daily-log.js:77` accepts unbounded input. When reviewing new client endpoints, verify text fields are capped.

### Areas explored (first-time reads on 2026-09-09)
- All of `api/lib/**`
- All of `api/dashboard/**` (except deep dive into `client-portal.js` PUT/PATCH branches - only saw the enable/disable portal branch)
- All of `api/client/**`
- Both cron endpoints
- `sw.js` (service worker)
- `js/shop.js` (Shopify integration)
- `product.html`, partial reads of `chs.html`, `client-dashboard.html`

### Areas NOT yet explored
- `js/quiz.js` (quiz logic, 443 lines)
- `js/main.js` (335 lines) - shared nav/scroll/animation code
- `thomas.html` (161KB, self-contained admin UI, lots of inline JS)
- Full `client-dashboard.html` (278KB, self-contained PWA UI, lots of inline JS)
- Blog directory
- CSS files (`css/style.css`)
- `api/dashboard/client-portal.js` PUT/PATCH branches (only saw POST enable/disable)

### False-positive patterns to avoid
- `SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js` looks like an exposed secret but is a public Storefront API token by design (Shopify's model). Not a security bug.
- `PROJECT_ID = 'prj_dfnyWZyIiFSPuIvCAreFxwPNYpdY'` in `analytics.js` is a Vercel project ID, not secret.
- Coach-controlled fields (client names, plan content, module content) being rendered as innerHTML in the admin dashboard is by design; Thomas is trusted. Only flag if a coach-controlled field crosses into a client-facing surface unsanitized (e.g., email HTML - which is a minor concern but low-impact).
- Cache name `telos-v1` never bumped: on the backlog. Fetch strategy is network-first so users get fresh content anyway.
