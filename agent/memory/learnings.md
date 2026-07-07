# Bug Hunter Learnings

This file accumulates cross-run knowledge for the Telos Bug Hunter. Keep entries dated. Compress older entries when the file exceeds 2000 lines.

## Codebase shape

- Pure static HTML + Vercel serverless functions. No build step.
- Dashboards (`thomas.html`, `client-dashboard.html`) are self-contained: inline CSS/JS, no `main.js`.
- Shared marketing/blog pages load `css/style.css?v=N` + `js/main.js`.
- Redis (Upstash) is the only backing store. Keys documented in `CLAUDE.md`.
- Two auth systems: admin session cookie (`telos_dash_session`) and client session cookie (`telos_client_session`).

## Confirmed-real bug patterns (approved before)

_(none yet - awaiting first decision)_

## Pending decision (submitted, not yet approved/denied)

- **2026-07-07-1** — Quiz "See Your Score" button is `type="button"`; click handler skips validation, letting users see results and unlock pricing without name/email.

## Known false-positive patterns (denied before)

_(none yet)_

## Skipped/known-backlog patterns (do not re-report unless status changes)

- `.html`-extension internal links across marketing/blog pages — logged in CLAUDE.md backlog. Widespread (~184 in `blog/`, plus `chs.html`, `pricing.html`, `product.html`, tool pages). Vercel `cleanUrls` still serves them.
- `todayStr()` UTC timezone bug on client dashboard streaks — logged in CLAUDE.md backlog.
- Tool pages missing `main.js` — logged in CLAUDE.md backlog.
- SW cache name still `telos-v1` — logged in CLAUDE.md backlog.
- Shopify Storefront token committed in `js/shop.js` — not a bug. Storefront tokens are designed to be public.

## Form-handling patterns (baseline knowledge)

- **Good** (`type="submit"` + real `submit` handler + JS validation): `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`.
- **Bad** (`type="button"` + click handler, no validation): `js/quiz.js` (this run's finding).
- The `.catch(function(){})` around `fetch('/api/submit-*')` in quiz.js and others silently swallows HTTP errors because `fetch` only rejects on network failure. When adding a new submission, either check `res.ok` in `.then` or don't rely on the fetch for validation feedback.

## Areas explored

- **2026-07-07** — First-ever run, Functional focus. Read all `api/lib/*`, all `api/submit-*`, key `api/client/*` (login, daily-log, training-log, nutrition-log, five-four-five, reset-password, food-search), `api/dashboard/clients.js` and `login.js`, and `api/cron/*` auth guards. Traced `js/quiz.js` end-to-end. Spot-checked `chs.html` form handler and both tool pages. Verified `vercel.json` cron auth. Did not read `client-dashboard.html` inline JS in depth (5000+ lines) - deferred to a future Functional or Visual/UX run.

