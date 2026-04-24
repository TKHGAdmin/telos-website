# Bug Hunter — Accumulated Learnings

Last updated: 2026-04-24

## How this file is used

Every run, the agent reads this file before hunting. Entries should be short, concrete, and actionable. When an entry stops being useful (false-positive pattern that no longer applies, resolved issue), delete or compress it.

Cap: 2000 lines. Compress older entries into a summary if exceeded.

---

## Codebase map (quick reference)

- **Static site** — no build step, no bundler, no npm deps outside Vercel serverless functions. Public pages are vanilla HTML + `css/style.css` + `js/main.js` + page-specific inline scripts.
- **Two dashboards** — `thomas.html` (admin, 158 KB) and `client-dashboard.html` (PWA, 272 KB). Both are fully self-contained: inline `<style>` + inline `<script>`. They do **not** load `css/style.css` or `js/main.js`. Changes to shared CSS/JS never affect them.
- **APIs** — all under `/api/`. `api/lib/redis.js` exposes `redis(cmd, ...args)` (single command) and `redisPipeline(commands)` (batched). `api/lib/auth.js` and `api/lib/client-auth.js` handle admin vs client session cookies separately.
- **Cache-busters** — CSS uses `?v=16` across all public pages (consistent). JS files have inconsistent `?v=` query params across pages — noted for Functional focus day.

## Patterns worth pattern-matching during future hunts

### Performance
- **N+1 fan-out on tab/chart load.** Any `Promise.all(dates.map(d => api('thing?date='+d)))` in `client-dashboard.html` is a candidate for a server-side range/pipeline mode. Cross-check the corresponding `api/client/*.js` — if it accepts only a single `date`, that's the gap. `daily-log.js` and `training-log.js` already have the right pattern (`redisPipeline`); use them as reference implementations.
- **Oversized images.** Photos exported from Lightroom with no web compression step show up as 1-2 MB JPEGs at source-camera resolution. Grep for `<img ` without `loading="lazy"`, then `file` each to check dimensions. Rendered size is always much smaller than source; the browser still downloads the whole thing.
- **Missing `loading="lazy"` below the fold.** As of 2026-04-24, zero occurrences across all 6 public pages. Partial fix might land via bug #3 — recheck on next Perf rotation.

### Functional
- Cache-buster `?v=N` consistency across pages. `main.js` is currently not versioned uniformly — `chs.html` loads it bare while others use `?v=2`.
- `CLAUDE.md` explicitly flags "todayStr() UTC timezone bug in client dashboard streaks" in the known-backlog section. Worth revisiting during Functional hunts.
- Blog pages (23 of them) are standalone HTML files — any bug in the blog template must be verified across all 23, not just one.

### Visual/UX
- Client dashboard design spec is strict: **gold is brand-only**, no cyan/purple, red-to-green spectrum for data. Any data visualization using non-spec colors is worth flagging.
- `main.js` is not loaded on dashboards — do not flag "missing hamburger handler" there; the dashboards inline their own.

### Security
- Rule from `CLAUDE.md`: secrets must never be in client bundles. Client has access to `VAPID_PUBLIC_KEY` (intended) but never the private key.
- Client auth cookie uses `SameSite=None; Partitioned` to survive Whop iframe. Admin cookie is `SameSite=Strict`. Don't flag the client cookie's laxer setting as a bug — it's intentional per the Whop integration note.
- Open Food Facts proxy (`api/client/food-search.js`) is public-proxied through client auth — confirm each hunt that it requires `verifyClientSession`.

## Known false-positive patterns (do not re-report)

- **"SVG icons in `images/` are unused."** `CLAUDE.md` already notes that `telos-icon-*.svg` are deprecated and safe to delete. Not a bug worth reporting again unless the `.svg` files re-appear in use somewhere.
- **"`client-dashboard.html` duplicates styling."** Per `CLAUDE.md`, self-contained inline styles are intentional for the dashboards. Do not flag as an organization bug.
- **"Blog pages don't use `style.css`."** Intentional per `CLAUDE.md` — each blog article is standalone with inline `<style>`.

## Things explored for the first time

- `2026-04-24` — First run. Bootstrapped `agent/memory/` and `agent/reports/`. Explored: `api/client/` endpoints, `api/lib/redis.js`, `client-dashboard.html` Nutrition tab render path, all public-page `<img>` tags and their `loading` attributes.

## Open questions for Thomas

- Is there a canonical bug-report schema to lock against? `docs/BUG_REPORT_SCHEMA.md` is missing — the 2026-04-24 report uses a reasonable default but should be ratified.
- Should the agent have read access to production-only config (Vercel env vars, deployed file sizes served with gzip, actual Upstash metrics) for more accurate perf estimates? Current reports rely on repo file sizes, which are pre-compression.
