# Telos Bug Hunter — Learnings

Accumulated knowledge across daily runs. Keep under 2000 lines; compress older entries into a summary when it grows.

## Codebase shape (first-run notes, 2026-11-02)

- Pure static HTML/CSS/JS site + Vercel serverless functions under `api/`. No build step. No test suite (`package.json` is a 77-byte stub — do NOT suggest `npm test`; it will not run).
- Auth lives in `api/lib/auth.js` (admin, HMAC-signed cookie, timing-safe password compare) and `api/lib/client-auth.js` (client PBKDF2 + HMAC-signed cookie, timing-safe signature compare).
- Admin dashboard (`thomas.html`) and client dashboard (`client-dashboard.html`) are self-contained — do NOT suggest moving their inline CSS/JS to shared files; it's by design.
- Public forms (`/api/submit-quiz`, `/api/submit-email`, `/api/submit-chs-application`) each have Redis-backed per-IP rate limiting. Auth endpoints (`/api/dashboard/login`, `/api/client/login`, `/api/client/reset-password`) do NOT. This asymmetry is the top security concern on the platform.
- Redis is Upstash via `api/lib/redis.js` (REST, no npm deps). Keys follow a strict `client_*:{clientId}:{YYYY-MM-DD}` convention documented in `CLAUDE.md`.
- Client IDs are integers from `INCR id:clients`, so the dot-delimited client token (`{clientId}.{expires}.{sig}`) is safe from clientId-collision — don't re-report that.

## Known limitations already tracked (do NOT re-report)

From `CLAUDE.md` → Known Limitations:
- Whop iframe on Safari/iOS cookie blocking (platform limitation, not a bug).
- `todayStr()` UTC timezone bug in client dashboard streaks — in the April 2026 P1-P3 backlog.
- SW cache version bump needed when assets change — in the P1-P3 backlog.
- Tool pages missing `main.js` — in the P1-P3 backlog.
- `.html` extensions in some internal links — in the P1-P3 backlog.

## False-positive patterns to avoid

- "Inline CSS/JS in dashboard HTML should be extracted" — the dashboards are intentionally self-contained per `CLAUDE.md`.
- "Add Prettier / ESLint / tests" — no build step is a stated design choice.
- "Remove deprecated SVG app icons" — `CLAUDE.md` already notes they're safe to delete; not a bug.
- "The site has no framework" — this is intentional.
- Daily-log date-range endpoint uses UTC in `new Date(now - i*86400000).toISOString().split('T')[0]` — this is the known `todayStr()` UTC bug class; already tracked, don't re-flag unless investigating a concrete miscount.

## Patterns to probe on future runs

- `verifyToken` in `api/lib/auth.js` compares HMAC with `!==` (not timing-safe), while the client version uses `timingSafeEqual` — a reusable finding seed worth re-checking if the admin auth is refactored.
- Login endpoints return specific error messages (`Portal access not enabled`, `Account is not active`, `Password not set`) that enable user enumeration — check whether the client-dashboard login UI surfaces these distinct errors to end users.
- Resend emails interpolate `client.name` with `+` string concatenation (no HTML escape). Low-impact in email context but worth checking if the same pattern is used in any admin-rendered template.
- `food-search.js` macro parsing: `n['energy-kcal_serving'] || n['energy-kcal_100g'] * q / 100 || 0` — a 0-kcal serving (diet drinks) falls through to the 100g calc. Edge case; not re-reporting until a user hits it.

## Infrastructure notes (first run)

- Agent directory did not exist until this run; scaffolding (`agent/memory/*`, `agent/reports/*`) created today.
- `docs/BUG_REPORT_SCHEMA.md` does not exist. Report written in a sensible self-describing format. If a future contributor adds the schema, re-format accordingly.
- `run.py` orchestrator referenced in the system prompt does not exist. This agent is firing from a scheduled Claude Code routine instead; delivery is via `PushNotification`, not email.
