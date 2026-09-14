# Bug Hunter Learnings

Accumulated knowledge to avoid repeating denials and to guide future hunts.

## First run - 2026-09-14

Bootstrap run. No prior reports, no decisions.jsonl history. Focus: Functional.

### Scaffolding notes
- `docs/BUG_REPORT_SCHEMA.md` was missing at bootstrap. Report format chosen: standard Markdown with severity-tagged sections, one heading per bug. If a stricter schema is added later, migrate.
- `agent/reports/` and `agent/memory/` created fresh.

### Codebase orientation (Telos Fitness)
- Pure HTML/CSS/JS, no build step. All API code is Vercel serverless functions under `/api/`.
- Data store is Upstash Redis via a thin REST wrapper in `api/lib/redis.js`. No `SCAN` calls anywhere - keys are enumerated via `clients_index`, `leads_index`, `chs_applications_index` ZSETs, so any secondary lookup key (`client_email:*`, `password_reset:*`, etc.) that isn't tied to an index will orphan if not explicitly cleaned up on delete.
- Two independent auth systems: admin (`api/lib/auth.js`, cookie `telos_dash_session`, single shared `DASHBOARD_PASSWORD`) and per-client (`api/lib/client-auth.js`, cookie `telos_client_session`, PBKDF2/100k SHA-512 per-client passwords). They share `SESSION_SECRET`.
- CLAUDE.md flags a known P1-P3 backlog including the `todayStr()` UTC timezone bug in client-dashboard streaks and a missing SW cache bump - already known, don't re-report.

### Patterns worth watching
- Every admin CRUD endpoint (`clients.js`, `pipeline.js`, `chs-applications.js`, `content.js`, `adspend.js`, `modules.js`) has the same shape: GET/POST/PUT/DELETE on a `foo:{id}` key and `foos_index` ZSET. Any secondary lookup key added to one entity is a candidate cleanup miss on DELETE.
- All three public form endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`) rate-limit by `x-forwarded-for`. On Vercel this is trusted from the edge, so fine.
- No admin login endpoint has rate limiting. Client login also unthrottled but PBKDF2 slows brute force naturally.
- Weekly summary and engagement cron emails compute stats from raw daily-log presence/absence. Timezone (UTC vs. ET) and "today not yet logged" edge cases affect user-facing numbers.

### False-positive patterns to avoid
- Shopify Storefront API tokens are designed to be public - hardcoding one in `js/shop.js` is by design, not a leak.
- Interpolating Shopify-controlled image URLs into HTML/onclick strings is theoretically XSS-shaped but Shopify normalizes URLs; not reportable unless a concrete injection vector is shown.
- The `todayStr()` UTC bug in `client-dashboard.html` is already documented in CLAUDE.md as known-and-unfixed. Do not re-report.
