# Telos Bug Hunter — Learnings

Accumulated knowledge from prior runs. Read this before hunting. Append new entries at the bottom. Compress old entries once this file exceeds 2000 lines.

---

## Architecture facts worth remembering

- Pure HTML/CSS/JS frontend, no build step. Production at `https://www.telosathleticclub.com`.
- Vercel serverless functions in `/api`. Upstash Redis via REST (no SDK).
- Two cookie sessions: admin (`telos_dash_session`, 2-part token, `SameSite=Strict`) and client (`telos_client_session`, 3-part token, `SameSite=None; Partitioned` for Whop iframe).
- All client portal endpoints require `verifyClientSession(req)` returning a `clientId`. All admin endpoints require `verifySession(req)` returning a boolean.
- Dates stored as `YYYY-MM-DD` strings, indexed in Redis ZSETs scored by `new Date(date).getTime()` (UTC midnight). Known TZ skew documented in CLAUDE.md.
- Execution Score spec (per CLAUDE.md): routine 25% + tasks 10% each capped at 50% + daily log 25%.
- Nutrition Score spec: 40% for logging meals + 60% scaled to macro compliance vs coach plan.

## False-positive patterns to avoid

_(populated as Thomas's denials accumulate)_

## Recurring-bug catalog

_(populated as bugs survive multiple reports)_

---

## Run log

### 2026-05-19 — first run (Functional)

- Bootstrapped agent infrastructure (was missing).
- API surface read: lib/auth, lib/client-auth, lib/redis, submit-*, client/login, client/daily-log, client/training-log, client/nutrition-log, client/activity-log, client/food-search, client/reset-password, dashboard/login, dashboard/clients, dashboard/client-portal, dashboard/chs-applications, dashboard/pipeline, dashboard/upload-video, dashboard/analytics, dashboard/emails, cron/weekly-summary, cron/engagement-check. Skimmed client-dashboard.html score logic.
- Patterns noticed:
  - Several CRUD DELETE handlers tear down the primary key but leave secondary lookups (`client_email:*`) orphaned.
  - `submit-email.js` and `submit-chs-application.js` both assume `body.email` is a string before calling string methods — non-string input crashes to 500.
  - Multiple endpoints (`daily-log`, `activity-log`) accept a `range` query without an upper bound, then build a Redis pipeline of that size.
  - Two implementations of the Execution Score (client dashboard + weekly summary email) both omit the "max 50%" task cap from spec — they only cap the total at 100.
  - `api/lib/auth.js verifyPassword` uses `String#length` (char count) then `Buffer.from(...,'utf-8')` (byte count) before `crypto.timingSafeEqual` — multibyte input of equal char-length crashes the comparator.
- New area explored for the first time: all of it (first run).
