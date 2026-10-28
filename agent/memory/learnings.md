# Bug Hunter — Learnings

Running log of patterns, false-positive filters, and codebase geography.
Keep under 2000 lines. Compress older entries into summaries when it grows.

## Codebase geography (as of 2026-10-28, first run)

- Pure HTML/CSS/JS + Vercel serverless functions. No build step. No npm deps beyond what Vercel installs at runtime for `api/*` (the project itself has no `node_modules` manifest).
- Data layer is Upstash Redis via a hand-rolled REST client (`api/lib/redis.js`). All multi-step reads use `redisPipeline`.
- Two auth cookies: `telos_dash_session` (admin, `SameSite=Strict`, HMAC payload = expiry) and `telos_client_session` (client, `SameSite=None; Partitioned`, HMAC payload = `clientId.expiry`).
- Cron: `weekly-summary` Mondays 14:00 UTC, `engagement-check` daily 15:00 UTC. Both guard on `CRON_SECRET` and gracefully skip if `RESEND_API_KEY` is unset.
- Client timezone: dates are stored and computed as UTC `YYYY-MM-DD` throughout. CLAUDE.md flags the UTC drift as a known P1-P3 backlog item (not re-reported).

## Known-noise patterns (do not report)

- `.html` extension in internal `<a href>` on tool pages (hyrox-predictor, protein-calculator, resources, shop). CLAUDE.md's "P1-P3 backlog" already covers this; `cleanUrls: true` in `vercel.json` fixes it transparently via redirect.
- `sw.js` cache name stuck at `telos-v1`. CLAUDE.md explicitly lists "SW cache version bump needed" as a known backlog item.
- Supabase anon key hard-coded in `set-password.html`. Supabase anon keys are designed to be public; row-level security is the real boundary.
- Shopify Storefront access token in `js/shop.js`. Storefront tokens are intentionally public (read-only scope).
- CLAUDE.md's `todayStr()` UTC timezone comment covers all UTC-vs-local date edge cases in `client-dashboard.html` streaks — do not re-flag those unless a specific user-visible break is reproducible.

## Confirmed patterns worth looking at next time

- All `/api/client/*` POST handlers that take `body.date` use `new Date(body.date).getTime()` for the ZSET score, which creates UTC midnight. Fine as a sort key, but any downstream code that compares to a local-time "today" has drift risk.
- Several `/api/client/*` POST handlers write arbitrary user-shaped objects (`completedSets`, `activities`, `meals`) into Redis without size caps. Vercel's 4.5MB body limit is the only ceiling.
- The weekly-summary and engagement-check crons both derive "day d" from `new Date(now - d*86400000).toISOString().split('T')[0]`. When the cron runs in the morning, `d=0` is today — in UTC — and almost always empty. Any downstream math that treats "no log for d=0" as a streak breaker will mis-report. (See bug 2026-10-28-01.)

## Open questions for next focus rotation

- Visual/UX: is there a mobile-safe-area regression on the new `/product` page? (Not inspected this run.)
- Performance: `client-dashboard.html` is ~278 KB inlined. Lighthouse pass next performance day.
- Security: `/api/client/notify.js` admits it does not implement Web Push encryption; verify no real pushes land in production, since the comment implies failure is silent.
