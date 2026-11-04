# Bug Hunter - Accumulated Learnings

Append-only knowledge the agent builds up across runs. Compress older entries into a summary when this file exceeds 2000 lines.

---

## 2026-11-04 (first run - functional focus)

### Codebase map
- Pure static HTML/CSS/JS on Vercel. No build step. Pages at project root; shared CSS in `css/style.css`, shared JS in `js/main.js` + `js/quiz.js` + `js/shop.js`. Serverless functions under `api/`.
- Auth: admin uses `api/lib/auth.js` (HMAC-signed cookie, timing-safe password check). Clients use `api/lib/client-auth.js` (PBKDF2, 100k iters, SHA-512). Both cookies share `SESSION_SECRET`.
- Data: Upstash Redis via REST (`api/lib/redis.js`). Keys documented in root `CLAUDE.md`.
- Service worker: `sw.js` registered only on `/client-dashboard`, but its scope is the whole origin — after a client visits the dashboard, the SW intercepts all site requests.

### Verified non-bugs (do not re-report)
- **`form.name.value` works in Chromium**: HTMLFormElement's named-element access returns the `<input name="name">` element even though `name` is also an IDL attribute on the form. Verified via Playwright 2026-11-04. The CHS application form's `form.name.value.trim()` pattern is safe.
- **`verifyPassword('')` with empty `DASHBOARD_PASSWORD` env var**: The `/api/dashboard/login.js` handler short-circuits on `!password` before calling `verifyPassword`, so an empty submitted password never reaches the comparison. Even if it did, the handler's own guard would reject it. Safe.
- **UTC-dated daily-log keys in cron handlers**: `engagement-check.js` and `weekly-summary.js` run at 3pm / 2pm UTC, which falls safely inside the same ET day. Not a bug under current cron schedules.
- **`.html` extensions in internal links**: Documented in CLAUDE.md "Known Limitations" as part of the April 2026 bug crawl backlog. Already triaged.
- **UTC timezone bug in client dashboard `todayStr()` streak calculation**: Documented in CLAUDE.md "Known Limitations". Already known.
- **SW cache version bump needed**: Documented in CLAUDE.md "Known Limitations". Already known.

### Patterns noticed
- **Lead-capture submits are non-blocking and swallow errors** (`fetch(...).catch(function(){})`). This is a deliberate UX choice — the user always proceeds to the next screen regardless of server response — but it means client-side validation has to be strict: any invalid data is silently lost.
- **Cache-busting query versions are inconsistent across pages**: e.g. `quiz.js?v=2` on index.html vs `quiz.js?v=3` on pricing.html; `shop.js?v=1` on shop.html vs `shop.js?v=2` on product.html; `chs.html` loads `main.js` with no version query at all. Minor but worth flagging in future runs if combined with other cache issues.

### Avenues not yet explored
- Admin dashboard (`thomas.html`) — 160KB self-contained. Large surface area for future runs.
- Client dashboard (`client-dashboard.html`) — 278KB self-contained.
- Blog pages (`blog/*.html`) — 23 standalone HTML files.
- `coaches.html` — 54KB, recently added (last 2 commits).
- `shop.html` / `product.html` — Shopify Buy SDK integration.
- Hyrox predictor — not yet opened.
