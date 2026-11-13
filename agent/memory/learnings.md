# Bug Hunter — Accumulated Learnings

## Bootstrap notes (2026-11-13)

This is the first run. `agent/memory/` and `agent/reports/` did not previously exist in the repo and were created this run. `docs/BUG_REPORT_SCHEMA.md` referenced by the agent instructions does not exist — this agent is constrained to writing under `agent/`, so the schema was not bootstrapped here. A one-time human setup should either create that schema doc or remove the reference from `agent/AGENT.md`. Until then, this agent follows a self-consistent report structure documented inline in each report.

No `run.py` orchestrator exists in the repo either; the scheduled task delivers the agent prompt directly and the agent itself is responsible for surfacing findings (commits + push notification), not the orchestrator.

## Codebase shape (observed this run)

- All API endpoints are plain CommonJS Vercel serverless functions in `api/`. They talk to Upstash Redis via `api/lib/redis.js` (REST client, no SDK).
- Two auth libraries: `api/lib/auth.js` (admin / `telos_dash_session`, 2-part token) and `api/lib/client-auth.js` (client / `telos_client_session`, 3-part token with PBKDF2 passwords).
- Admin endpoints call `verifySession(req)` (admin cookie) at the top of every handler. Client endpoints call `verifyClientSession(req)` and get the clientId back.
- Redis keys are coordinated by convention, not by a schema module. Several composite indexes (ZSETs) mirror main records; deletions must clean all of them.

## Patterns worth remembering

- `verifyToken` in `api/lib/auth.js` uses plain `!==` for the signature compare; `client-auth.js` uses `crypto.timingSafeEqual`. Minor timing side channel (saved for a Security-focus day).
- `req.headers['x-forwarded-for']` is used verbatim as part of rate-limit keys. It's client-forgeable on Vercel. Any new rate limit should go through a shared helper (not yet introduced).
- Admin dashboard `login.js` has no rate limiting. Save for Security day — but note it's a single `DASHBOARD_PASSWORD`, so lockout would also lock Thomas out. Fix needs care.
- `client_email:{normalizedEmail}` lookup is written lazily (only when portal is enabled). Several code paths assume it exists or is absent in ways that don't fully hold. Reported today.
- All `DELETE` handlers for records with multiple secondary keys/indexes need a cleanup pass. `modules.js` DELETE does this; `clients.js` DELETE does not (reported today).

## False-positive patterns to avoid in future runs

None accumulated yet — no denials in `decisions.jsonl`.

## Areas explored for the first time

- `api/dashboard/*` CRUD endpoints (clients, modules, client-portal)
- `api/client/*` auth, log, nutrition, training, reset-password
- `api/submit-*.js` public endpoints
- `api/cron/engagement-check.js`

## Areas not yet explored

- `thomas.html` admin UI (very large, 161 KB inline) — frontend logic likely has its own bugs
- `client-dashboard.html` (278 KB inline) — the PWA's state/date handling, 545 flow, FAB modals
- Blog templates in `blog/` — SEO/schema.org correctness, link rot
- `sw.js` service worker — cache busting, update flow
- `js/main.js` — scroll animation / nav behavior across pages
- `coaches.html`, `product.html`, `shop.html` — newer pages, not seen by prior crawl
- `set-password.html` — new landing page for member-app invite flow
- `vercel.json` — CORS scope, cron secrets end-to-end
