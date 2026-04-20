# Telos Bug Hunter Learnings

This file is the agent's accumulated knowledge across runs. Keep entries short,
concrete, and dated. Newest at top. Trim older entries into summary form when the
file exceeds ~2000 lines.

---

## Known backlog (from CLAUDE.md) - do NOT re-report as new

These P1-P3 items are documented in the git history (commit 7fa38ff plan file)
and treated as "already known, still unresolved". Do not open new bugs against
them.

- Tool pages missing `main.js` include
- `.html` extensions in internal links
- `todayStr()` UTC timezone drift in client dashboard streaks
- Service worker cache version needs a bump on cached-asset changes
- Whop iframe on Safari/iOS - third-party cookie blocked, documented tradeoff

## Codebase map (for orientation)

- Static HTML multi-page site, no build step, hosted on Vercel
- Serverless functions under `api/` - vanilla JS, no TypeScript
- Auth split: admin (`/thomas`, HMAC cookie) vs client (`/client-dashboard`,
  PBKDF2 + session cookie). Two separate cookie names: `telos_dash_session`
  and `telos_client_session`
- Data store: Upstash Redis via REST (key patterns in CLAUDE.md)
- Shared CSS in `css/style.css`; dashboards are self-contained with inline CSS

## Anti-patterns to avoid reporting

- Style preferences (naming, formatting, comment density)
- "Could be refactored" without a concrete defect
- Best-practice nits with no user-visible or developer-visible impact
- Duplicate bugs already filed in last 14 days of reports
- Items already listed in the "Known backlog" section above

## Session log

### 2026-04-20 - first run (Functional)
- Bootstrapped `agent/memory/` and `agent/reports/` infra + schema doc
- Initialised focus rotation starting at Functional
- Reported 3 bugs: engagement-check email spam (P1), DELETE clients orphans
  `client_email:*` lookup (P2), weekly-summary streak starts at today and
  almost always reads 0 (P2)
- Pattern noted: Redis data-lifecycle is managed piecemeal across handlers -
  `client_email:*` is created in client-portal.js but deleted only in two of
  the three places it should be. Worth auditing other secondary-index keys
  (push sub, training/nutrition indexes) for similar orphaning on delete
- Pattern noted: crons have no idempotency/throttle layer; any repeat-send
  logic would have to be added per-cron. Worth looking at weekly-summary for
  the same multi-send risk (though the Monday-only cadence limits blast)
- Confirmed "already known" backlog items stay out of new reports
