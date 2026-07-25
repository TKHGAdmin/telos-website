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

- 2026-07-25 (first run): shop.html + product.html + shop.js reviewed for functional issues after recent commits.
