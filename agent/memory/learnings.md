# Bug Hunter Learnings

Accumulated knowledge across runs. Prepended by newest entries.

## Codebase shape (bootstrap notes, 2026-07-25)

- Pure static HTML/CSS/JS, no build step. `js/main.js` shared across public pages; `js/quiz.js`, `js/shop.js` page-specific.
- Dashboards (`thomas.html`, `client-dashboard.html`) are **self-contained** — inline CSS/JS, do NOT load `main.js` or `style.css`. Don't flag "missing main.js on dashboard" — intentional.
- API is Vercel serverless functions under `/api/`. Redis is Upstash REST (no client library, plain fetch under `api/lib/redis.js`).
- Auth split: admin uses `telos_dash_session` (SameSite=Strict, 2-part token). Client uses `telos_client_session` (SameSite=None+Partitioned for Whop iframe, 3-part token). Different cookies, different HMAC formats — do not confuse.
- Clean URLs enabled in vercel.json — internal links should NOT include `.html`. Internal `.html` refs on public pages are legitimate findings; blog uses `../` prefix.
- CSS version query param `?v=N` bumped on style.css changes. Currently `?v=16`.

## Known intentional patterns (do NOT flag)

- Quiz/email form POSTs are fire-and-forget with silent fail — that's the documented pattern.
- Safari/iOS + Whop iframe cookie limitation is documented; not a bug.
- Old SVG icons (`telos-icon-*.svg`) are deprecated but unremoved — documented in CLAUDE.md.
- No em dashes anywhere — this is a style rule, not a bug.
- Missing tests — the project has no test suite by design; do NOT report "add tests".

## False-positive patterns to avoid

(will grow as denials accumulate)

- Do not report "missing CSRF token on POST endpoint" — SameSite cookies + no third-party form posts is the design.
- Do not report "unhandled promise rejection" on background analytics / notification pings — silent-fail is intentional.

## Coverage log

- 2026-07-25 (first run, Functional): shop.html + product.html + shop.js + api/dashboard/{clients,client-portal,login}.js + api/cron/engagement-check.js. 5 findings (1 P1, 2 P2, 2 P3). No P0.

## Patterns noticed

- **`api/dashboard/clients.js` DELETE is minimal.** It only removes the top-level `client:{id}` record and the sorted-set index. It does NOT touch: `client_email:*` (documented in today's #2), `client_dailylog:*`, `client_nutrition_log:*`, `client_training_log:*`, `client_supplement_log:*`, `client_activity_log:*`, `client_545_*`, `client_supplement_plan:*`, `client_nutrition_plan:*`, `client_mindset:*`, `client_resources:*`, `client_sidemenu:*`, `client_training_program:*`, `push subscription`, or any of the ZSET indexes. Any future "clean up on delete" bug likely lives here. Investigate before flagging repeat orphan-key bugs.
- **CSS cache-busting is manual and per-page.** `style.css` is bumped globally per convention (currently `?v=16`), but page-specific scripts (`js/shop.js`, `js/quiz.js`) are pinned per-page and can drift. Check `?v=` alignment when the same file is referenced from multiple HTML pages.
- **API handlers destructure `req.body` at the top without guards.** `api/dashboard/login.js:8` is the case reported today; grep for `const { .* } = req.body;` before doing another Functional day - the same pattern is likely repeated across POST endpoints.
- **Crons have no idempotency layer.** `api/cron/engagement-check.js` illustrated today; the weekly-summary cron should be checked next Functional day for similar re-send-on-retry behavior.
