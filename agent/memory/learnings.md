# Bug Hunter - Accumulated Learnings

This file is append-only. Compress older entries into a summary once it crosses 2000 lines.

---

## 2026-11-26 - First run

**Setup gap discovered on first invocation**

The scheduled task fired against a repo that had no `agent/`, `agent/memory/`,
`agent/reports/`, or `docs/BUG_REPORT_SCHEMA.md`. No `run.py` orchestrator
was present either. This run bootstrapped the directory layout and a
minimal schema so subsequent runs have the files the prompt expects to
read.

**Persistence risk (needs human decision)**

Cloud sessions here clone the repo fresh each run, so anything written to
`agent/memory/` or `agent/reports/` is gone by the next invocation unless
it is committed and pushed. This run did NOT commit - that is a decision
for Thomas. Options:
  1. Commit the agent scaffold + each day's report to `main` (or a
     long-lived branch), so each run can read prior memory/reports.
  2. Move memory + reports to Upstash Redis, keyed under an `agent:*`
     prefix (would require an app-code change to add an admin endpoint,
     which this agent is not allowed to make).
  3. Accept that each run is stateless and rebuild the rotation each day
     from the current date mod 4.

Until a decision is made, every run will look like day one.

**Known backlog from CLAUDE.md (do not re-flag as new bugs)**

- Tool pages missing `main.js`
- `.html` extensions in some internal links
- `todayStr()` UTC timezone bug in client dashboard streaks
- Service worker cache version bump needed
- Whop iframe cookies blocked on Safari/iOS

**Patterns noticed in the Node API layer**

- Rate limit keys use `req.headers['x-forwarded-for']` directly - safe on
  Vercel (it rewrites the header to the real client IP) but would be
  spoofable in other deployments.
- Date math for "last N days" is repeated in several endpoints
  (`daily-log.js`, `weekly-summary.js`, `engagement-check.js`,
  `training-log.js`) and all use `toISOString().split('T')[0]`, i.e.
  UTC. This is the same family as the known `todayStr()` bug but on the
  server side. The client dashboard runs in the user's local tz; the
  server runs in UTC. Any streak/history query crossing a day boundary
  will see a gap.
- Admin-authored strings (client name, module titles, email template
  body) are concatenated into HTML emails without escaping. Admin is
  trusted, so it is a hygiene issue rather than XSS. Noting for later;
  not reporting today.
- Password reset in `api/client/reset-password.js` only deletes the
  single reset token on use; previously-issued tokens for the same
  client remain valid until their 1hr TTL. Minor.

**False-positive patterns to avoid**

- Items already in the CLAUDE.md "Known Limitations" section are not
  new findings; refer to them by name only if they recur with new
  symptoms.
- The business email `telosfitnessllc@gmail.com` appearing in a
  User-Agent is deliberate per Open Food Facts policy; not a leak.
