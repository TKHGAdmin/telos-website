# Telos Bug Hunter - Accumulated Learnings

Compact knowledge base. Prepend new entries with date. Compress older ones when this exceeds ~2000 lines.

---

## 2026-07-13 — First run bootstrap

**Codebase shape (as of first run):**
- Pure static HTML/CSS/JS site + Vercel serverless functions under `/api`. No build step.
- Public pages: `index.html`, `pricing.html`, `chs.html`, `shop.html`, `product.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, plus 23 blog posts under `/blog/`.
- Two private surfaces: `thomas.html` (admin, HMAC-signed session cookie) and `client-dashboard.html` (client PWA, PBKDF2 + separate cookie). Both are self-contained and do NOT load `js/main.js`.
- Redis: Upstash via `api/lib/redis.js` REST client. No npm deps for auth/session.
- Cron: two jobs (`weekly-summary`, `engagement-check`) guarded by `Bearer $CRON_SECRET`.

**Auth model (verified all endpoints on first run):**
- All `api/dashboard/*.js` except `login.js` and `logout.js` call `verifySession` on line ~5.
- All `api/client/*.js` except `login.js`, `logout.js`, `reset-password.js`, `notify.js`, `send-email.js` call `verifyClientSession` on line ~5.
- `notify.js` and `send-email.js` under `/api/client/` are admin-triggered — they intentionally use `verifySession` (admin) rather than `verifyClientSession`. Do not flag as missing client auth.

**Known bugs already documented in CLAUDE.md (do NOT re-report):**
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) missing `js/main.js` — documented in the "Bug crawl P1-P3 backlog" section of CLAUDE.md.
- `todayStr()` UTC timezone bug in client-dashboard streaks — same section.
- SW cache version bump needed — same section.
- Whop iframe + Safari third-party cookie limitation — Known Limitations section.
- `.html` extensions in some internal links — Known Limitations section.

**Trust boundaries to remember:**
- `SHOPIFY_STOREFRONT_TOKEN` in `js/shop.js:15` is a public Storefront API token by design. Not a secret. Do not report.
- Shopify-controlled data (product titles, image URLs, variant IDs) reaches templated onclick handlers via string concat — technically fragile if a URL contained a single quote, but Shopify CDN URLs and gid:// variant IDs never do in practice. Low priority.
- Admin-set fields (e.g., `client.name`) reach outgoing HTML emails without escaping (`reset-password.js:58`, `send-email.js`). Trust boundary is "admin trusts themselves" — low real-world impact but note for future audits if a self-serve name field ever gets added.

**Focus rotation math:**
- Focus is stored in `focus-rotation.json`. Increment `nextFocus = (currentFocus + 1) % 4` after each run.
- Day 0=Functional, 1=Visual/UX, 2=Performance, 3=Security.

**False-positive patterns to avoid (seed list — expand from decisions.jsonl):**
- Reporting the public Shopify Storefront token as an exposed secret.
- Reporting missing `main.js` on protein-calc / hyrox pages (already documented).
- Reporting `todayStr()` UTC bug (already documented).
- Theoretical timing-attack concerns on `verifyToken` non-timing-safe HMAC compare — attacker needs 2^256 signature enumerations, not exploitable.
- CORS setHeader appearing redundant on `/api/submit-*` endpoints — vercel.json globally injects the same header, so manual calls are dead code but not bugs.

**Areas explored so far:**
- `api/lib/{auth,client-auth,redis}.js`
- `api/submit-{quiz,email,chs-application}.js`
- `api/dashboard/*.js` (auth surface only)
- `api/client/*.js` (auth surface only, plus `notify.js`, `send-email.js`, `reset-password.js`)
- `api/cron/engagement-check.js`
- `js/shop.js` (full)
- `js/quiz.js` (full)
- `sw.js`, `manifest.json`, `vercel.json`, `package.json`
- Nav structures in index.html, product.html, shop.html
- `client-dashboard.html` (spot checks: date handling, localStorage usage, FAB state)

**Areas NOT yet explored (targets for future runs):**
- Full `client-dashboard.html` inline JS (5200 lines — training/nutrition/545/hydration logic)
- Full `thomas.html` admin logic (3100 lines)
- `api/client/{daily-log,training-log,nutrition-log,five-four-five}.js` internals
- Blog HTML for broken links, missing schema.org fields
- `js/main.js` (nav, tilt, scroll animations)
- CSS style.css for responsive breakpoints
