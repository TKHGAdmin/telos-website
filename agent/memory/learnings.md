# Telos Bug Hunter — Learnings

Accumulated knowledge from daily runs. Each entry: what I noticed, what it taught me.

## Codebase notes

- Pure HTML/CSS/JS — no build step. Public pages share `js/main.js` and `css/style.css`.
- Two self-contained dashboards: `thomas.html` (admin, password-gated) and `client-dashboard.html` (PWA, client portal). Neither loads `main.js` or `style.css`.
- API is Vercel serverless functions, no npm deps. Upstash Redis via REST helper at `api/lib/redis.js`.
- Auth split: admin uses `lib/auth.js` (HMAC cookie, `telos_dash_session`), clients use `lib/client-auth.js` (PBKDF2 + HMAC cookie, `telos_client_session`).
- Client identifier is a Redis-issued numeric id (`INCR id:clients`). Token format: `{clientId}.{expires}.{signature}`. Safe because clientId never contains `.`.
- Redis key conventions: `client:{id}` for record, `client_email:{normalizedEmail}` for lookup, `client_{thing}:{id}[:date]` for nested data, plus `..._index` ZSETs for ordering.
- The `2026-04 bug crawl plan` (CLAUDE.md mention) covers known P1-P3 items already on the backlog: tool pages missing main.js, `.html` extensions in internal links, `todayStr()` UTC timezone bug in streaks, SW cache version bump. Don't re-report these.

## Patterns I've noticed

- Several admin DELETE endpoints (e.g. `dashboard/clients.js`, `dashboard/pipeline.js`, `dashboard/chs-applications.js`) follow the pattern `DEL record + ZREM index`. None of them walk associated keys. The clients DELETE in particular leaves a meaningful amount of orphaned data because of how many `client_*:{id}` keys exist.
- Only the three public POST endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`) have rate limiting. Login endpoints (admin + client) and `reset-password` do not.
- Several POST handlers (`training-log`, `supplement-log`) overwrite rather than merge with the existing record. They are currently safe only because the client UI always sends the full state. Brittle.
- Email HTML templates concatenate `client.name` into HTML without escaping. The admin sets the name, so risk is low, but it's an unprincipled pattern that should be fixed if any user-controllable field ever flows into these templates.

## False-positive patterns to avoid

(empty — to be populated from `decisions.jsonl` denials)

## Areas explored

- 2026-06-23: First run. Explored `api/`, top-level HTML files, `js/main.js`, `js/quiz.js`. Did not deep-read `thomas.html` (3.2k lines) or `client-dashboard.html` (5.2k lines) — only grepped.
