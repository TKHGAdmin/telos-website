# Telos Bug Hunter — Learnings

Running log of what I've learned about the Telos Fitness web platform
and what to watch for or avoid in future runs. Compressed when it grows
past 2000 lines.

---

## 2026-10-31 — Bootstrap

### Project shape (quick reference)
- Pure static HTML/CSS/JS site + Vercel serverless functions.
- Data in Upstash Redis via the REST API — no ORM, no npm redis client.
  Keys are string-templated (`client:{id}`, `client_dailylog:{clientId}:{YYYY-MM-DD}`,
  ZSET indices named `*_index`).
- Admin dashboard (`/thomas`) and client dashboard (`/client-dashboard`) are
  intentionally self-contained — they do NOT load `js/main.js` or `css/style.css`.
  Treat any suggestion to "share CSS" as noise.
- Public marketing pages DO load `js/main.js` and `css/style.css?v=16`.
- Clean URLs: internal links drop `.html` because `vercel.json` sets
  `cleanUrls: true`. Links WITH `.html` on marketing pages still work but
  are inconsistent — a backlog item already acknowledged by Thomas.
- Two cookie namespaces: `telos_dash_session` (admin, 2-part token,
  `SameSite=Strict`) and `telos_client_session` (client, 3-part token,
  `SameSite=None; Partitioned` for Whop iframe embedding).

### Known backlog — do NOT re-report these
These are already acknowledged by Thomas. Skip unless I find a specific
new instance beyond what's in the April 2026 bug crawl.

- Tool pages missing `js/main.js`.
- `.html` extensions in some internal links.
- `todayStr()` UTC timezone bug in client dashboard streaks.
- Service-worker cache version bump needed.
- Whop iframe + Safari/iOS: third-party cookies blocked, client login
  fails. Documented in CLAUDE.md "Known Limitations".

### Report schema (my own definition, until docs/BUG_REPORT_SCHEMA.md is added)
Each day's report lives at `agent/reports/YYYY-MM-DD.md` and uses this exact
layout:

```markdown
# Telos Bug Hunter — YYYY-MM-DD

**Focus**: Functional | Visual/UX | Performance | Security
**Findings**: N

---

## P<0-3> — <short title>

- **File**: path/to/file.js:LINE
- **Trigger**: how to reproduce or where it fires
- **Why**: one or two sentences on why it is wrong (not just what)
- **Fix**: one-sentence suggestion
- **Confidence**: high | medium

(repeat per finding, severest first; omit entirely if zero findings)

---

## Summary

<One short paragraph. If zero findings, say so plainly.>

## Patterns observed

- <bullet>
```

### False-positive patterns to avoid
(Populate as denials come in via `decisions.jsonl`. Start empty.)

### New areas explored this run
- Full codebase sweep baseline — api/, api/client/, api/dashboard/, api/cron/,
  api/lib/, js/, root HTML dashboards.

### Patterns worth remembering next hunt
- **Delete-cascade blind spots**: `clients.js` DELETE at line 147-148 only removes
  `client:{id}` and `clients_index`. All derived keys (`client_email`,
  `client_dailylog:*`, `client_training_log:*`, `client_nutrition_log:*`,
  `client_supplement_log:*`, `client_activity_log:*`, `client_545_daily:*`,
  the `*_index` ZSETs) are orphaned. Only `client_email` surfaces as a
  functional bug today (reported) but the rest is a watchlist.
- **UTC date arithmetic in cron + daily endpoints**: `new Date(now - d * 86400000).toISOString().split('T')[0]`
  is used across cron and daily-log endpoints. Expect timezone off-by-ones
  around midnight ET on the same shape as the Monday-streak bug.
- **Non-atomic GET-modify-SET on daily logs**: `activity-log.js:60-77`,
  `five-four-five.js:92-124`, `daily-log.js:64-88`. Latent concurrency hazard.
- **Dashboard list endpoints: no pagination, no cap**: `clients.js:19`,
  `pipeline.js:14` do `ZREVRANGE 0 -1` + full GET pipeline. Scales badly.
- **Admin HMAC compare uses `!==`** (`api/lib/auth.js:27`) while client-auth
  uses `timingSafeEqual`. Not practical today, but worth harmonizing.

### Report format decision for the first run
- `docs/BUG_REPORT_SCHEMA.md` does not exist in this repo. For now I use the
  schema baked into this `learnings.md` (section "Report schema"). The
  parser referenced in the agent prompt isn't present either — reports
  are human-readable Markdown until Thomas wires an emitter.
- Keep two levels of structure: per-finding block (File / Trigger / Why / Fix / Confidence)
  and a trailing Summary + Patterns observed section.
