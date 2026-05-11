# Telos Bug Hunter — Learnings

Accumulated knowledge from past hunts. Keep under 2000 lines.

---

## 2026-05-11 — Bootstrap notes

This was the first run. There was no prior `agent/` infrastructure, no `docs/BUG_REPORT_SCHEMA.md`, and no prior reports or decisions to learn from. I created `agent/memory/` and `agent/reports/` and seeded `focus-rotation.json` with today=functional, tomorrow=visual.

### Schema gap
The runbook references `docs/BUG_REPORT_SCHEMA.md` but the file does not exist. Hard rule #2 says I can only write to `agent/memory/` and `agent/reports/`, so I did NOT create the schema doc — Thomas should write it. Until then, future runs should mirror the structure used in `agent/reports/2026-05-11.md`:

```
# Telos Bug Hunter Report — YYYY-MM-DD
**Focus:** functional|visual|performance|security
**Bugs found:** N
---
## BUG-YYYY-MM-DD-NNN — Title
- **Severity:** P0|P1|P2|P3
- **Focus:** ...
- **Status:** new|recurring
- **File:** path/to/file.js:LINE
- **Confidence:** high|medium
### Summary
### Reproduction
### Why this matters
### Suggested fix
---
## Items considered and excluded
## Zero-bug check
```

The bug-id format `BUG-YYYY-MM-DD-NNN` is the parser-friendly handle for decisions.jsonl.

### Codebase map (high-confidence after Day 1 audit)

**Trust boundaries:**
- Public endpoints (no auth): `/api/submit-quiz`, `/api/submit-email`, `/api/submit-chs-application`. All rate-limited per IP.
- Client portal endpoints (`telos_client_session` cookie): `/api/client/*`. Cookie is `SameSite=None; Partitioned` to support Whop iframe.
- Admin endpoints (`telos_dash_session` cookie): `/api/dashboard/*`. Cookie is `SameSite=Strict`.
- Cron endpoints: `/api/cron/*` require `Bearer ${CRON_SECRET}` header.

**Storage:** All persistence is Upstash Redis via `/api/lib/redis.js`. No SQL. No npm Redis client — they use Upstash REST.

**Auth pattern:**
- `lib/auth.js` — admin (password-only, HMAC-signed cookie, 7-day expiry)
- `lib/client-auth.js` — clients (PBKDF2 password hashing, HMAC-signed cookie)
- Note these two files have inconsistent HMAC compare patterns (admin uses `!==`, client uses `timingSafeEqual`). Reported as BUG-2026-05-11-003.

### Hot spots — where to look next

Areas I touched lightly on Day 1 and want to revisit on future rotations:

- **Client portal data lifecycle** — DELETE leak (BUG-001) is one example. Suspect there are other "create one key, forget to delete sibling keys" patterns in `api/dashboard/client-portal.js` (e.g., disabling portal removes email lookup but leaves password hash on the client record — re-enabling reuses old password, intentional? maybe).
- **Quiz / lead-capture flow** — `submit-quiz.js` doesn't validate `scores` or `totalScore` shape; an attacker could POST junk and pollute the dashboard. Probably P3 since it's a marketing page.
- **`api/dashboard/login.js`** — no rate limit, `verifyPassword` short-circuits on length mismatch. Save for security focus day.
- **`api/dashboard/upload-video.js`** — admin-only but the `filename` param is concatenated into a blob path without validation. Worth re-checking under security focus.
- **`api/dashboard/clients.js` PUT email change** — only updates the email lookup if `portalEnabled` is true at the time of the PUT. Race: if coach changes email then enables portal in two separate requests, the lookup may not match. Could not yet construct a clean repro — re-audit on next functional rotation.
- **`api/cron/engagement-check.js`** — no throttle on repeated sends. Daily reminders to a single inactive client could be spammy. Get product input before reporting.
- **`thomas.html` and `client-dashboard.html` are huge** (161KB and 278KB respectively, all inline CSS/JS). They were not audited line-by-line — high probability of UI/UX bugs there. Visual focus days should prioritize these.
- **`js/main.js` line 280** — parallax math goes negative-opacity before `Math.max` clamps it; harmless, but a pattern to watch.

### Triage rules I'm applying

1. **Bootstrap = conservative.** With zero approval signal, I'd rather report 3 strong findings than 8 mixed-quality ones. Trust earns volume.
2. **Skip what CLAUDE.md already flags as backlog.** The "Bug crawl P1-P3 backlog" section near the bottom of CLAUDE.md lists items Thomas already knows about. Don't waste a report slot on those.
3. **Don't report "could be improved."** Only report when I can name the file, line, repro, and consequence.
4. **Don't report dual-purpose admin-only quirks as P0/P1.** If the only attacker is the admin, the blast radius is tiny.

### False-positive patterns to remember

(Will populate as I get denied feedback in `decisions.jsonl`.)
