# Telos Bug Hunter - Learnings

Rolling notes on patterns, false-positive traps, and areas explored.
Keep under 2000 lines. Compress older entries when approaching the limit.

## Known limitations (do NOT re-report)

From `CLAUDE.md` -> "Known Limitations":

- Whop iframe on Safari/iOS: client portal cookies blocked. Documented architectural tradeoff, not a bug.
- `tool pages missing main.js`: `hyrox-predictor.html` and `protein-calculator.html` intentionally skip `main.js`. Each ships its own inline scripts. Do not report as missing dependency.
- `.html` extensions in internal links: known legacy pattern, Vercel `cleanUrls: true` serves clean URLs regardless.
- `todayStr() UTC timezone bug in client dashboard streaks`: client-side timezone issue, already on backlog.
- SW cache version bump needed when static assets change: policy issue, re-flag only when a stale asset is actually shipping to users.
- `coaches.html` nav is intentionally custom (no shared main.js, no "Client Login" link): it is a specialized landing page with its own JS and a sparser nav. Do not report as missing.
- `chs.html` nav is intentionally overridden via inline CSS; it still loads shared `main.js` so hamburger/scroll still work. Do not report the visual difference as a bug.

## Patterns to be careful about

- The `?v=` CSS cache-bust and the `?v=` on `main.js` are TWO INDEPENDENT versions. CSS is at `v=16`, `main.js` is at `v=2`. A mismatch across these two values is NOT a bug.
- `chs.html` loads `js/main.js` without a `?v=` version query. Minor stylistic inconsistency, not a user-facing bug - flag only if main.js is updated in a way that breaks chs.html.
- The `verifyPassword` in `api/lib/auth.js` compares `inputStr.length` (char count) against `expected.length` before Buffer compare. Non-ASCII passwords would throw at `timingSafeEqual` because byte length differs from char length. In practice DASHBOARD_PASSWORD is ASCII, so not a bug - but worth remembering if password policy changes.
- Rate limits use `x-forwarded-for` directly as a cache key. On Vercel this is set to the real client IP by the platform. No bug.

## Areas explored

- 2026-11-24 (functional, run 1): API endpoints (submit-*, client/*, cron/*, dashboard/lib/*), newer HTML pages (product, shop, coaches, set-password), auth libraries, Shopify shop.js integration. Did NOT yet explore: `thomas.html` internals, `blog/*` pages beyond nav, image assets, service worker logic, push notification code, module endpoints.

## Future ideas

- Audit for N+1 Redis calls per client in cron jobs (there are already pipelines, but some loops do 3 x 7 sequential pipelines per client, could be one bigger pipeline).
- Check for repeated DOM queries in `main.js` (perf focus).
- Check all public endpoints for OPTIONS CORS consistency (some send CORS headers only on success, not on error).
- Verify client-dashboard.html supplement/activity/food-search error paths render a visible message (not silent fail).
