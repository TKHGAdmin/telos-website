# Bug Hunter — Learnings

Rolling notes that inform each run. Kept under 2000 lines; older entries compressed as needed.

## Codebase orientation (bootstrapped 2026-07-31)

- **Repo:** static HTML + Vercel serverless (`api/**/*.js`). No build step, no framework.
- **Data store:** Upstash Redis via REST wrapper in `api/lib/redis.js`. Everything is JSON strings + ZSET indices.
- **Two auth systems:** admin (`lib/auth.js`, cookie `telos_dash_session`, `SameSite=Strict`) and client (`lib/client-auth.js`, cookie `telos_client_session`, `SameSite=None; Partitioned` for Whop iframe embedding).
- **Public forms path:** `js/quiz.js` (index + pricing) and inline `<script>` in `protein-calculator.html`, `hyrox-predictor.html`, `chs.html`. All fire-and-forget POST to `api/submit-*.js`.
- **Cron jobs:** `weekly-summary` (Mon 14:00 UTC) and `engagement-check` (daily 15:00 UTC). Both require `CRON_SECRET` and `RESEND_API_KEY`.

## Known-issue register (don't re-flag these)

Per `CLAUDE.md` "Known Limitations" — treat as documented, out of scope until owner asks:

- `todayStr()` in `client-dashboard.html` uses UTC (`new Date().toISOString().split('T')[0]`) — streak/check-in date drift for non-UTC users. Backlog item.
- Whop iframe login on Safari/iOS — third-party cookie blocked; documented workaround is direct URL / PWA shortcut.
- Tool pages missing shared `main.js`; internal links using `.html` in a few spots; SW cache-version bump pending.
- Bug-crawl P1-P3 backlog referenced in commit `7fa38ff` — inspect that plan before flagging any dashboard/tool-page item to avoid duplication.

## False-positive patterns to avoid

_(Populated as denials accrue in decisions.jsonl. None recorded yet — this is run 1.)_

Preemptive avoids for this codebase:
- **"Add TypeScript / add tests / add lint"** — out of scope. Not a bug.
- **"Redis errors aren't retried"** — the codebase intentionally fails-open for public write paths (silent-fail for lead capture is a product choice, though missing error surfacing to the user IS a bug — see report 2026-07-31).
- **"Admin endpoint has no rate limit"** — session-gated; not a defect unless it's a public path.
- **CSRF via `SameSite=None`** — cookie is intentionally cross-site for Whop iframe embedding. Only flag if a specific POST endpoint has real damage potential AND no Origin check; do not blanket-flag the cookie itself.

## Patterns worth watching each run

- **Fire-and-forget `fetch(...).catch(function(){})`** — appears in every public form. Silently swallows 400/429/500. Recurring source of "lost leads."
- **`GET → mutate → SET` on Redis** — used in most POST handlers (daily-log, activity-log, push-subscribe, reset-password, client-portal). Any two overlapping writes can drop fields. Concurrency-race bug class.
- **ZSET index vs record drift** — writes to `X:index` and `X:{id}` are not atomic. Look for delete paths that skip one side (see `dashboard/clients.js` DELETE).
- **Method dispatch fallthrough** — most handlers explicitly `return res.status(405)` at bottom. Files that don't (e.g. `dashboard/revenue.js`) hang the request until `maxDuration: 60s` timeout.
- **Streak/date math in cron** — recomputed each run from ZSETs; the "today's log missing → streak = 0" pattern (see `weekly-summary.js:86-90`) is worth checking on any similar loop.

## Scope reminders

- Only the **Telos Fitness web platform**. Not FORGE OS, not any other repo.
- Only READ application code. Writes go to `agent/memory/` and `agent/reports/` only.
- Zero-bug reports are honest and preferred over padded ones.

## Infra note (2026-07-31)

`docs/BUG_REPORT_SCHEMA.md` referenced in the system prompt does NOT exist in this repo. First-run report uses a self-consistent schema (see report file). Owner may want to author a real `BUG_REPORT_SCHEMA.md` to lock the parser contract; this agent cannot create files outside `agent/` per hard rule 2.
