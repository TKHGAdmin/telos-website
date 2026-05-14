# Telos Bug Hunter — Learnings

Running notes accumulated across daily runs. Compress entries older than ~60 days when this file exceeds 2000 lines.

## Codebase shape (verified 2026-05-14)

- Pure static site + Vercel serverless functions. No build step, no test suite, no `package.json` scripts beyond what Vercel needs.
- Public marketing pages load `js/main.js` and `css/style.css`. Dashboards (`thomas.html`, `client-dashboard.html`) are fully self-contained (all CSS/JS inline) and do NOT load the shared bundle.
- Redis (Upstash) is the only datastore. Access via `api/lib/redis.js` exposing `redis()` and `redisPipeline()`.
- Auth: admin uses `telos_dash_session` cookie (SameSite=Strict, 2-part token). Client uses `telos_client_session` cookie (SameSite=None+Partitioned, 3-part token). Different verify helpers in `api/lib/auth.js` vs `api/lib/client-auth.js`.
- Known issue tracked in CLAUDE.md: Whop iframe on Safari/iOS breaks client login due to cookie blocking — do NOT re-flag.

## Patterns to watch

- N+1 Redis round-trips: many handlers use serial `await redis(...)` calls when a single `redisPipeline` would suffice. Worth flagging only when on a hot path or in a per-client loop.
- Cron handlers do per-client `await fetch(...)` to Resend — sequential email sends can chew through the 60s function budget at scale.
- Images directory has at least one egregiously oversized JPEG (`thomas.jpeg` 1.9MB / 1206x2136). Watch the directory for new offenders.
- Google Fonts request loads many weights — confirmed all weights 300-900 are actually referenced, so don't flag as bloat.
- Service worker `CACHE_NAME = 'telos-v1'` — bump when cached asset list changes (per CLAUDE.md convention). Re-check before flagging.

## Known false-positive patterns (do NOT report)

- The Whop iframe / Safari third-party cookie limitation — documented as a known limitation in CLAUDE.md, not a bug.
- Old SVG icons (`telos-icon-192.svg`, `telos-icon-512.svg`) being unreferenced — CLAUDE.md explicitly marks them deprecated and safe to delete; not a bug.
- "Code could be cleaner" / stylistic preferences — out of scope.

## Files / areas inspected so far

- `images/` (sizes, formats, usage)
- `index.html`, `chs.html` hero + about sections
- `client-dashboard.html` head (Chart.js loading)
- `css/style.css` font-weight usage
- `api/cron/weekly-summary.js`, `api/dashboard/stats.js`, `api/client/modules.js`
- `sw.js` cache strategy
- `vercel.json` function config + cron schedule

## Files / areas NOT yet inspected

- Blog HTML files (23 articles)
- Most `api/dashboard/*` endpoints
- Most `api/client/*` endpoints (food-search, training-log, etc.)
- `js/main.js`, `js/quiz.js` content
- `pricing.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`
- Inline JS in `thomas.html` (~3200 lines) and `client-dashboard.html` (~5200 lines)
