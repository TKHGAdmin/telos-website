# Bug Hunter Learnings

Accumulated knowledge from daily runs. Compress older entries when this file exceeds 2000 lines.

## Codebase overview (bootstrapped 2026-09-29)

- Pure HTML/CSS/JS static site + Vercel serverless functions (Node CJS).
- No test suite, no linter config, no `tsc`. Static analysis has to be by-eye.
- Redis via Upstash REST client at `api/lib/redis.js`. Commands are sent as JSON POST bodies.
- Admin session: HMAC-signed cookie `telos_dash_session` (see `api/lib/auth.js`).
- Client session: `telos_client_session` with `SameSite=None; Partitioned` for Whop iframe support.
- Shop pages (`shop.html`, `product.html`) use Shopify Buy SDK v3 (loaded from `sdks.shopifycdn.com`). The Storefront API token in `js/shop.js` is intentionally client-side - Storefront API tokens are designed to be public. Do NOT flag it as a leaked secret.
- Known-and-accepted issues from CLAUDE.md - do NOT re-report:
  - `todayStr()` UTC timezone bug in client dashboard (line 1841 of client-dashboard.html).
  - Whop iframe login on iOS Safari cookie blocking.
  - Tool pages missing main.js in some places, `.html` in internal links, SW cache version bump.

## Infrastructure notes

- `docs/BUG_REPORT_SCHEMA.md` referenced by the agent instructions does not exist in the repo. Reports use an inferred schema documented in the header of each report file.
- `agent/memory/` and `agent/reports/` were bootstrapped 2026-09-29. No prior reports or decisions to reference.
- Focus rotation began on 2026-09-29 with **Functional**. Next run should be **Visual/UX**.

## Patterns to watch

- CSS Grid layouts with a hardcoded column count are fragile when adding sibling elements. When adding a new direct child, verify the intended layout (wrap it under an existing column or update the grid template).
- Shopify variant / line-item IDs are GraphQL-style `gid://shopify/...` strings. They contain slashes and colons; safe inside single-quoted onclick attributes but would break inside double-quoted ones. Watch for future refactors.
- The dashboard `client_email:` lookup is written ONLY by `client-portal.js` when the portal is enabled - the duplicate-email check in `clients.js` POST will not catch duplicates until at least one client has enabled the portal for that address. This is intended per the CLAUDE.md flow but worth remembering.

## False-positive patterns to avoid

- (none yet - build up from `decisions.jsonl` denials as they arrive)
