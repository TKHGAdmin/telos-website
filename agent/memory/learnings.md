# Bug Hunter Learnings

Running notes on patterns, false-positive traps, and codebase geography.
Trimmed to keep under 2000 lines - older entries get compressed.

---

## Codebase geography (day 1 pass)

- Pure static HTML/CSS/JS, no build step. Vercel `cleanUrls: true` handles
  the `.html` stripping. Serverless functions live under `api/`.
- Redis is used for all app state (Upstash REST client, no npm deps).
- Two auth systems: `api/lib/auth.js` (admin `/thomas`) vs
  `api/lib/client-auth.js` (client PWA). They diverged in implementation:
  admin uses plain string compare for HMAC verification, client uses
  `crypto.timingSafeEqual`. Worth watching for further drift.
- Recent shop/product page work (May 2026) added a Shopify Buy SDK
  integration. Product detail page uses a CSS grid with a fragile
  child-count assumption (see 2026-08-19 report).
- CLAUDE.md documents a known P1-P3 backlog from an April 2026 crawl
  (todayStr() UTC timezone bug, tool pages missing main.js, .html links).
  Do not re-report these as "new" - reference them if they resurface.

## False-positive traps to remember

- `SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js` LOOKS like a leaked secret,
  but Shopify's Storefront API access token is DESIGNED to be public
  (read-only, client-side). Not a bug.
- `product.descriptionHtml` interpolated via `innerHTML` in `js/shop.js`
  is generally acceptable - Shopify sanitizes merchant HTML.
- `verifyPassword` in `api/lib/auth.js` returns false when lengths differ
  before calling `timingSafeEqual` - that's the correct pattern, not a
  timing leak (timingSafeEqual requires equal-length buffers).
- The `pipeline()`/`parallel()` distinction in `redisPipeline` returns
  `[{result: ...}]` shape, not a raw array. Endpoints correctly unwrap
  `r.result` from pipeline responses.

## Reporting conventions (day 1 bootstrap)

- The scaffolding this agent's instructions reference (`docs/BUG_REPORT_SCHEMA.md`,
  a `run.py` orchestrator) does NOT exist yet in the repo. Reports are
  being written to `agent/reports/YYYY-MM-DD.md` in a defensible default
  Markdown schema until a real schema lands. Flagged this in the day-1
  notification so Thomas can define one.
- Focus rotation is stored in `agent/memory/focus-rotation.json` as
  `{"day": N, "focus": "..."}`. Rotate to `(day + 1) % 4` at end of each
  run. Order: 0=Functional, 1=Visual/UX, 2=Performance, 3=Security.
- `agent/memory/decisions.jsonl` starts empty. Populate one JSON object
  per line as Thomas approves/denies findings:
  `{"date":"YYYY-MM-DD","bug_id":"...","verdict":"approved|denied|fixed","note":"..."}`.

## Areas covered so far

- `api/lib/{auth,client-auth,redis}.js`
- `api/{submit-quiz,submit-email,submit-chs-application}.js`
- `api/dashboard/{login,analytics}.js`
- `api/client/{login,daily-log,five-four-five,training-log,reset-password}.js`
- `api/cron/{weekly-summary,engagement-check}.js`
- `js/shop.js` (full)
- `product.html`, `sw.js`, `vercel.json`, `package.json`
- Skimmed: cross-file `index.html` link patterns, recent commit history.

## Areas NOT yet covered (queue for future runs)

- `thomas.html` (2966-line admin dashboard, self-contained CSS/JS)
- `client-dashboard.html` (4644-line PWA, self-contained)
- `api/client/{modules,module,module-progress,food-search,notify,
  push-*,send-email,activity-log,supplements,supplement-log,sidemenu,
  nutrition-*,mindset,resources,training-program,me}.js`
- `api/dashboard/{clients,client-portal,pipeline,revenue,content,
  adspend,modules,upload-video,delete-video,chs-applications,
  emails,stats,submissions}.js`
- `chs.html`, `pricing.html`, `index.html`, `resources.html`
- All 23 blog articles
- `js/main.js`, `js/quiz.js`
