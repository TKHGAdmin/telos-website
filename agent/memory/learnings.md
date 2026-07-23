# Bug Hunter — Learnings

Accumulated knowledge across runs. Newest entries at the top. Compress when the file exceeds 2000 lines.

## 2026-07-23 (first run, focus: functional)

### Repo shape
- Static HTML/CSS/JS site, no build step. Root-level `index.html`, `pricing.html`, `chs.html`, `shop.html`, `product.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, `thomas.html`, `client-dashboard.html`.
- API: Vercel serverless functions under `api/` split into `api/dashboard/*` (admin), `api/client/*` (client portal), `api/cron/*`, and public endpoints (`submit-quiz.js`, `submit-email.js`, `submit-chs-application.js`).
- Data store: Upstash Redis via `api/lib/redis.js` REST wrapper.
- Auth: `api/lib/auth.js` for admin (HMAC-signed session cookie), `api/lib/client-auth.js` for client (PBKDF2 hash + client session token).
- `thomas.html` and `client-dashboard.html` are self-contained (all CSS/JS inline). Public marketing pages share `css/style.css` and `js/main.js`.

### Known backlog — DO NOT re-report
From CLAUDE.md § "Known Limitations" and the April 2026 bug crawl (commit `7fa38ff`):
- Tool pages missing `js/main.js` load.
- `.html` extensions still used in some internal links (should use clean URLs).
- `todayStr()` UTC timezone bug in client dashboard streaks.
- SW cache version bump needed.
- Whop iframe on Safari/iOS blocks third-party cookies for client login.

### Patterns worth watching (for future runs)
- New pages added since April 2026: `shop.html`, `product.html`. Both load Shopify Buy SDK v3.
- `product.html` and `shop.html` share `js/shop.js` but each pins its own `?v=` cache-bust version — bumping the file requires updating BOTH pages (see today's P3 finding).
- Recent commit history is churny around shop/product (7 commits in a row touching the same files). Regressions likely if not verified in-browser.

### False-positive patterns to avoid
_(none yet — populate from denial signal in `decisions.jsonl` on future runs.)_

### Verification gaps for this run
- Could not fetch the live production site via WebFetch (proxy returned 403 on `https://www.telosathleticclub.com/shop`). All findings this run are from static analysis of source + confirmed by git history. When live-site fetch is available in future runs, use it to reproduce visual/layout bugs.
