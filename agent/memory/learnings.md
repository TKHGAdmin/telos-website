# Agent Learnings

Accumulated knowledge across daily runs. Compress older entries when this file exceeds 2000 lines.

## Codebase orientation

- Pure static HTML + Vercel serverless functions (Node.js, no TypeScript, no build step).
- Two auth systems, both in `api/lib/`:
  - **Admin** (`auth.js`) — single `DASHBOARD_PASSWORD`, HMAC-signed cookie `telos_dash_session`, 7-day expiry, `SameSite=Strict`. Used by `api/dashboard/*` and `api/client/notify.js` + `api/client/send-email.js` (admin-triggered from the dashboard, despite the path).
  - **Client** (`client-auth.js`) — per-client email/password (PBKDF2 100k SHA-512), signed cookie `telos_client_session` = `{clientId}.{expiry}.{signature}`, 7-day expiry, `SameSite=None; Partitioned` for Whop iframe.
- All app state lives in Upstash Redis via a hand-rolled REST client (`api/lib/redis.js`). No ORM. Keys documented in `CLAUDE.md`.
- Cron endpoints require `Authorization: Bearer <CRON_SECRET>`, fail closed if the env var is missing.
- Every dashboard endpoint I checked correctly calls `verifySession(req)` before any Redis I/O.
- Every client endpoint I checked correctly calls `verifyClientSession(req)` — but see the "known gotchas" below.
- HTML rendering in `thomas.html` consistently uses an `esc()` helper (DOM `textContent`-based) for admin-authored fields. `client-dashboard.html` mostly uses `esc()` too; a couple of spots render coach-authored HTML raw on purpose (side menu custom "panel" items, mindset content).

## Known gotchas / patterns to watch

- **Session lifetime vs. authorization state.** `verifyClientSession` only validates the signed cookie; it never re-checks `client.portalEnabled` or `client.status`. Anything a coach revokes in the admin UI only takes effect at the next login. See BUG-20260807-1.
- **Reverse-index hygiene.** Several admin CRUD endpoints delete the primary key but forget to clean up derived indexes / lookups:
  - `dashboard/clients.js` DELETE leaves `client_email:{email}` orphaned (BUG-20260807-2), and also leaves every `client_*:{id}:*` data key.
  - `dashboard/modules.js` DELETE cleans series + pillar indexes but never cleans `client_module_progress:*` or `client_modules_watching/completed:*` keys.
  - Check every DELETE handler for symmetry with its POST/PUT.
- **Rate limiting is only on public unauth endpoints.** `submit-quiz`, `submit-email`, `submit-chs-application` rate-limit by IP. `api/client/login.js` and `api/dashboard/login.js` do **not** — brute-force is unbounded (BUG-20260807-3).
- **Coach-authored fields rendered raw.** In `client-dashboard.html`: `item.content` (side-menu custom panel), `item.icon`, mindset HTML. Not a bug — intentional coach-authored HTML — but worth remembering so I don't flag it every rotation.
- **Vercel body handling.** Some handlers rely on `req.body` being parsed JSON (default). `upload-video.js` disables the parser via `module.exports.config = { api: { bodyParser: false } }` to stream to Blob. Keep this quirk in mind when analyzing body handling.
- **Cookies.** Admin uses `SameSite=Strict`; client uses `SameSite=None; Partitioned` (documented reason: Whop iframe). Both `Secure; HttpOnly`.
- **Timing-safe compare in `auth.js`.** Uses an early-return length check before `timingSafeEqual`. Reveals password length via timing, but the DASHBOARD_PASSWORD is server-set and stable, so this is a theoretical minor. Not worth reporting.
- **CORS on `/api/submit-*`.** `vercel.json` returns `Access-Control-Allow-Origin: *`. Intentional so the marketing pages / external landing embeds can POST. Combined with per-IP rate limits it's acceptable. Do not flag.

## False-positive patterns to avoid (empty — will grow with denials)

_None yet — decisions.jsonl is empty until Thomas starts reviewing._

## Areas explored so far

- `api/lib/{auth,client-auth,redis}.js` — read in full
- `api/lib/*` auth helpers, session token formats, PBKDF2 params
- `api/dashboard/{login,clients,client-portal,modules,analytics,chs-applications,upload-video,delete-video}.js`
- `api/client/{login,logout,me,daily-log,training-log,nutrition-log,five-four-five,module,module-progress,notify,send-email,push-subscribe,food-search,reset-password}.js`
- `api/{submit-quiz,submit-email,submit-chs-application}.js`
- `api/cron/weekly-summary.js`
- `vercel.json`
- Spot-checks in `thomas.html` and `client-dashboard.html` for `innerHTML` usage + the `esc()` helper.

## Areas not yet explored (next rotations)

- Blog HTML files (`/blog/*.html`) — SEO / accessibility / structured data correctness
- `sw.js` service worker — cache eviction, push handling
- `js/main.js`, `js/quiz.js`, `js/shop.js` — front-end logic bugs
- Full read of `thomas.html` (~4k lines) and `client-dashboard.html` (~5k lines) — event handlers, state management
- `api/cron/engagement-check.js`
- Remaining `api/client/*` (activity-log, supplements, supplement-log, resources, mindset, modules, nutrition-plan, sidemenu, training-program)
- Remaining `api/dashboard/*` (pipeline, revenue, stats, submissions, emails, content, adspend)
- `shop.html` / `product.html` / Shopify integration
- Live-site checks (mobile responsive breakpoints, Lighthouse, live form submissions)
