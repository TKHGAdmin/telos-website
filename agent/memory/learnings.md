# Bug Hunter Learnings

Accumulated knowledge across runs. Append new entries at the bottom under the right heading.
Compress older entries into the summary section once this file exceeds 2000 lines.

---

## Known issues (documented in CLAUDE.md - do NOT re-report)

These are explicitly tracked in CLAUDE.md's "Known Limitations" / "Bug crawl P1-P3 backlog" section
or otherwise acknowledged. Do not include them in reports.

- Whop iframe login broken on Safari/iOS (third-party cookie restriction). Mitigation documented.
- `todayStr()` in client-dashboard.html uses `new Date().toISOString().split('T')[0]` which is UTC.
  Affects streak counting for users in non-UTC timezones. Already on backlog.
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) do not load `js/main.js`. Backlog item.
- Some internal links may still use `.html` extensions despite Vercel `cleanUrls: true`. Backlog item.
- SW cache version is `telos-v1`. CLAUDE.md says it needs a bump when cached assets change.

## False-positive patterns to avoid

- Shopify Storefront API tokens hardcoded in `js/shop.js` - these are designed to be public,
  scoped to product read + checkout creation. Not a secret leak.
- `verifyToken` in `api/lib/auth.js` uses `signature !== expected` (non-timing-safe). HMAC
  is unkeyed to attacker, no remote timing oracle exploitable. Don't flag as security issue.
- Email enumeration prevention in `reset-password.js` returns 200 even when user not found.
  This is intentional.
- `client.status !== 'active'` returns 401 on login - looks like an info leak but matches the
  intentional "Account is not active" UX message.

## Codebase patterns noted

- All API handlers follow `module.exports = async function handler(req, res)` pattern with
  explicit method routing.
- Public submit endpoints use IP-based rate limits via `ratelimit:{scope}:{ip}` Redis keys
  with 3600s TTL.
- Cron endpoints require `Bearer {CRON_SECRET}` in Authorization header.
- Client session cookies are `SameSite=None; Partitioned` (for Whop iframe).
  Admin cookies are `SameSite=Strict`.
- `client-dashboard.html` and `thomas.html` are fully self-contained (inline CSS+JS).
  Do not propose moving their styles into `css/style.css`.
- The codebase intentionally has no build step. Do not propose webpack/vite/etc.

## Areas explored

- 2026-05-24 (run 01, functional): `/api/submit-*`, `/api/lib/auth.js`, `/api/lib/client-auth.js`,
  `/api/client/login.js`, `/api/client/reset-password.js`, `/api/client/training-log.js`,
  `/api/client/supplement-log.js`, `/api/cron/engagement-check.js`, `/api/cron/weekly-summary.js`,
  `/api/dashboard/clients.js`, `js/quiz.js`, `js/shop.js`. Not yet touched on functional pass:
  most of `client-dashboard.html` (~278KB), `thomas.html` (~161KB), blog HTML.
