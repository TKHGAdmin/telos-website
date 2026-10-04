# Telos Bug Hunter - Learnings

This file accumulates patterns across runs. Keep it under 2000 lines.

## 2026-10-04 (first run)

### Infrastructure note
- The `agent/` directory and `docs/BUG_REPORT_SCHEMA.md` referenced in the agent spec did not exist when this agent first ran. This run bootstrapped `agent/memory/` and `agent/reports/` and adopted the report format below. Future runs should follow the same shape so a parser can be written against it.

### Report format (used in lieu of docs/BUG_REPORT_SCHEMA.md)
Each report is a single Markdown file at `agent/reports/YYYY-MM-DD.md` with this structure:

```
# Telos Bug Report - YYYY-MM-DD

**Focus:** <functional | visual-ux | performance | security>
**Findings:** <N>

## Summary
<One paragraph if findings exist; otherwise a plain "No bugs found today." line.>

## Findings

### <ID> - <P0|P1|P2|P3> - <Short title>
- **File:** `path/to/file.ext:LINE`
- **Category:** <functional | visual-ux | performance | security>
- **Summary:** <One sentence.>
- **Repro:** <Exact steps or exact code path.>
- **Impact:** <Who it affects and how.>
- **Suggested fix:** <Shortest viable fix.>

(repeat per finding)
```

Finding IDs: `YYYY-MM-DD-NN` (two-digit sequence per day).

### Codebase orientation
- Pure static HTML/CSS/JS. Vercel serverless under `/api`.
- Upstash Redis via helper in `api/lib/redis.js`. Admin auth is HMAC cookie (`api/lib/auth.js`). Client auth is PBKDF2 + HMAC cookie (`api/lib/client-auth.js`).
- Client dashboard and admin dashboard are both self-contained HTML files with inline CSS/JS.
- CLAUDE.md documents known backlog items (tool pages missing main.js, `.html` extensions in internal links, `todayStr()` UTC bug, SW cache version bump). Do NOT re-report these - they are tracked.
- Push notifications in `api/client/notify.js` are a documented placeholder (no VAPID JWT, no RFC 8291 encryption). Do NOT re-report.

### False-positive patterns to avoid next time
- Shopify Storefront API tokens hardcoded in `js/shop.js` are expected to be public per Shopify docs - NOT a secret exposure.
- Tool page hamburger duplication is a side effect of "tool pages missing main.js" which is already known.
- `.html` extensions in internal links are already in the known backlog.
- Weak client-side email validation (`.includes('@')`) is intentional - real validation happens server-side.

### Promising areas yet to be investigated deeply
- `thomas.html` admin dashboard (~161KB, 10 tabs). Only innerHTML uses were scanned; full logic path review pending.
- `client-dashboard.html` training timer edge cases (what happens on tab switch mid-timer?).
- CRON endpoints: full concurrency/retry behavior not evaluated.
- Admin PATCH/DELETE endpoints beyond `clients.js` (pipeline, revenue, content, chs-applications).
