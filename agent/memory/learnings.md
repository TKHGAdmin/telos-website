# Telos Bug Hunter - Learnings

Accumulated knowledge, patterns, and false-positive rules. Kept under 2000 lines.

## Report schema (self-documented until docs/BUG_REPORT_SCHEMA.md exists)

Each daily report is a single Markdown file at `agent/reports/YYYY-MM-DD.md` with this exact structure:

```
# Bug Hunt Report - YYYY-MM-DD

**Focus:** <one of: Functional | Visual/UX | Performance | Security>
**Findings:** <integer count>
**Run duration:** <optional freeform>

## Summary

<1-3 sentences on the state of things. If zero findings, say so plainly.>

## Findings

### [P0|P1|P2|P3] <short-slug> - <one-line title>

**File:** `<repo-relative-path>[:line]`
**Category:** <functional | visual-ux | performance | security | correctness | data-integrity | ...>

**What's wrong:**
<1-3 sentences describing the defect>

**How to reproduce / failure scenario:**
<concrete inputs/state and the resulting wrong output/crash>

**Suggested fix:**
<1-2 sentence direction, no code required>

(Repeat for each finding, ordered P0 -> P3.)
```

If zero findings, omit the "## Findings" section and say so in "## Summary".

## Areas of the codebase explored

- 2026-09-06: `api/lib/{auth,client-auth,redis}.js`, `api/submit-*.js`, `api/client/{login,daily-log,reset-password,training-log,food-search,notify,send-email}.js`, `api/dashboard/{login,clients,client-portal,pipeline,upload-video}.js`, `api/cron/{weekly-summary,engagement-check}.js`, `vercel.json`, `js/main.js`. First full functional pass on the API layer.

## Patterns noticed

- **Rate limiting is inconsistent.** Public form submissions (`submit-quiz`, `submit-email`, `submit-chs-application`) all rate-limit by IP. Auth-adjacent endpoints (`api/client/login`, `api/dashboard/login`, `api/client/reset-password`) do not.
- **Redis key lifecycles are asymmetric.** Multiple resources are created in one code path (POST/PUT) but the corresponding DELETE does not clean them up. Watch for orphaned lookup keys (`client_email:*`) and orphaned per-client child keys (`client_dailylog:{id}:*`, `client_nutrition_log:{id}:*`, etc.) after client deletion.
- **UTC date derivation.** Every `client_*_log:{id}:{date}` uses `new Date().toISOString().split('T')[0]` which is UTC, not ET. Server crons that read "today" backwards from `now` inherit this. The `todayStr()` bug in `client-dashboard.html` is already in the P1-P3 backlog per CLAUDE.md - don't re-report unless a new symptom surfaces.
- **Body destructuring without guarding `req.body`.** Some handlers do `const { x } = req.body` at the top; if the request has no JSON body Vercel sets `req.body` to `undefined`, which crashes with TypeError before rate limits or validation trigger. Low value to report standalone but worth tracking if a specific endpoint is exercised without a body.

## Known-in-backlog issues (do NOT re-report unless new symptom)

Per `CLAUDE.md` "Bug crawl P1-P3 backlog" (commit 7fa38ff plan):
- Tool pages missing `main.js`
- `.html` extensions in some internal links
- `todayStr()` UTC timezone bug in client dashboard streaks
- Service worker cache version bump needed

## False-positive patterns to avoid

(none yet - populate as decisions.jsonl accumulates denials)

## Notes on infrastructure

- On first run (2026-09-06) the agent tree, `docs/BUG_REPORT_SCHEMA.md`, and any decisions history did not exist. Bootstrapped `agent/memory/` and `agent/reports/` from scratch (Hard Rule 2 permits this). Did NOT create `docs/BUG_REPORT_SCHEMA.md` because that path is outside the write allowlist; the schema is documented above instead. If Thomas wants a versioned schema file, he can move this section into `docs/BUG_REPORT_SCHEMA.md` himself.
