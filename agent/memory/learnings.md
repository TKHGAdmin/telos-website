# Telos Bug Hunter — Learnings

Persistent notes across runs. Kept under 2000 lines.

## Bootstrap notes (first run — 2026-08-14)

- **`docs/BUG_REPORT_SCHEMA.md` does not exist yet.** I inferred a schema from the intent of the system prompt and used it in the first report. If Thomas creates a formal schema later, this file should be re-read on run start to match. The parser mentioned in the prompt isn't in the repo either.
- Bootstrap files created: `agent/memory/learnings.md`, `agent/memory/decisions.jsonl`, `agent/memory/focus-rotation.json`, `agent/reports/`.
- I own writes ONLY to `agent/memory/**` and `agent/reports/**`. Never edit application code.

## Codebase mental model

- Pure static HTML + Vercel serverless (`api/**` — plain Node handlers, no framework).
- Two auth surfaces: `api/lib/auth.js` (admin cookie `telos_dash_session`) and `api/lib/client-auth.js` (client cookie `telos_client_session`).
- All state in Upstash Redis via `api/lib/redis.js` (REST calls, no npm client). Keys are string-joined (no schema).
- Dashboards are self-contained HTML with inline styles — no shared CSS with the marketing site. Do NOT flag "missing style.css include" on `thomas.html` / `client-dashboard.html`.
- CLAUDE.md flags an existing P1-P3 backlog Thomas already knows about: tool pages missing main.js, `.html` in internal links, `todayStr()` UTC timezone bug in client dashboard streaks, SW cache version bump. **Do not re-report these unless they've regressed or worsened.**

## Patterns worth watching

- Any `innerHTML = '<img src="' + externalUrl + ...` — Shopify CDN URLs are trusted today but this pattern is fragile if Shopify ever returns unusual characters, and it would break if the product source changes.
- Rate-limit keys built from `req.headers['x-forwarded-for']` — Vercel concatenates client-supplied XFF to the real IP, so a fresh XFF per request rotates the bucket. Not exploited in the wild, but a real bypass. Not being flagged today as P0/P1 because the ceiling is low (Redis writes only) — revisit if abuse appears.
- `new Date('YYYY-MM-DD').getTime()` parses as UTC midnight; ZADD scores end up shifted vs. the client's local day. Already-known bug per CLAUDE.md; do not re-flag.
- Endpoints that trust `req.body` shape (JSON.parse'd previously) — Node handlers on Vercel auto-parse JSON only if content-type is `application/json`. If body is undefined, `body.foo` throws; several handlers assume `req.body` is an object (see all `api/client/*`). Not a defect if the request is well-formed, but a poor-input crash surface.

## Known false-positive traps (avoid re-reporting)

- **Empty-password bypass in `api/lib/auth.js:verifyPassword`.** Looks scary — if `DASHBOARD_PASSWORD` env var is unset, `timingSafeEqual('', '')` returns true. BUT the login endpoint guards with `if (!password || !verifyPassword(password))`, so an empty submitted password fails before ever reaching the compare. Not exploitable via the login route. Only re-flag if a new call site of `verifyPassword` skips the truthiness guard.
- **`descEl.innerHTML = product.descriptionHtml`** in `js/shop.js`. Deliberate — product rich-text descriptions are authored by Thomas in Shopify admin, which is a trusted source.
- **Rate-limit XFF bypass** — noted above; do not report until abuse observed OR endpoint value increases.
- **`todayStr()` UTC timezone bug** — CLAUDE.md marks as known, do not re-flag.

## Focus rotation

- Day 0: Functional
- Day 1: Visual/UX
- Day 2: Performance
- Day 3: Security
