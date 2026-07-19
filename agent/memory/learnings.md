# Bug Hunter Learnings

Accumulated knowledge across runs. Newest at bottom.

## 2026-07-19 - First run (Functional focus)

### Codebase orientation
- API layer: 3 public endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`), plus `client/*` (client-portal) and `dashboard/*` (admin) and `cron/*`.
- Two auth systems:
  - Admin (`lib/auth.js`): HMAC-signed cookie `telos_dash_session`, format `{expires}.{sig}`, SameSite=Strict, timing-safe password compare.
  - Client (`lib/client-auth.js`): HMAC-signed cookie `telos_client_session`, format `{clientId}.{expires}.{sig}`, SameSite=None + Partitioned (for Whop iframe).
- Redis is Upstash REST-only (no npm dep). Keys use colon separators. Every client-scoped write also updates a ZSET index.
- `client_email:{normalizedEmail} -> clientId` is the login lookup - **this mapping is the single point of coupling between clients and login**, and manipulating it in one place without checking another is the source of the two P1 bugs found this run.

### Patterns to check next time
- **Cross-endpoint mutation of `client_email` mapping**: three writers (`clients.js` POST/PUT, `client-portal.js` POST). Each must check for owner conflicts AND delete stale entries.
- **UTC vs local date drift**: `new Date(now - d*86400000).toISOString().split('T')[0]` is used in `daily-log.js`, `engagement-check.js`, and elsewhere. CLAUDE.md flags this as a known P1-P3 backlog item ("todayStr() UTC timezone bug"). Don't re-report unless investigating a specific new symptom (e.g. streak break at edge case for a specific tz).
- **Rate limit key from `x-forwarded-for` raw**: not split on comma. On Vercel this is usually a single IP, but worth revisiting if we see per-IP counts diverge in dashboard analytics.
- **`innerHTML` with interpolated attributes**: `js/shop.js` builds onclick handlers by string-concatenating URLs. Low-risk today (Shopify CDN URLs) but a pattern worth flagging if we ever extend it to admin-supplied content.

### False-positive patterns to avoid
- `verifyPassword` accepting empty input when `DASHBOARD_PASSWORD` is unset: not exploitable because `login.js` gates with `if (!password)` before calling. Do not re-report.
- Method-check-before-auth-check ordering (e.g. `emails.js`): trivial 405 vs 401 information disclosure, not worth flagging.
- Bare `var` re-declarations across if-branches (`reset-password.js`): legal in function-scoped JS, purely stylistic.

### Not yet explored (target for future runs)
- `client-dashboard.html` inline JS (278KB file - streak calculation, FAB show/hide, food-search modal state).
- `thomas.html` inline JS (161KB - pipeline drag/drop, client editor forms).
- Blog articles (23 files in `/blog/`) - visual/accessibility pass on rotation day 1.
- Service worker `sw.js` cache versioning and push handling.
- `js/main.js` for the shared nav/hamburger and animation logic.
