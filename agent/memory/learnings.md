# Telos Bug Hunter - Learnings

Accumulated knowledge from past runs. Patterns, false-positive filters, and codebase landmarks.

## Codebase landmarks (initial pass, 2026-11-15)

- **Stack**: Pure HTML/CSS/JS, no build step. Vercel serverless functions in `api/`. Upstash Redis for state.
- **Two auth systems**:
  - Admin (`lib/auth.js`): single password, HMAC-signed session token `{expires}.{sig}`, cookie `telos_dash_session`, `SameSite=Strict`.
  - Client (`lib/client-auth.js`): per-client PBKDF2 passwords, token `{clientId}.{expiry}.{sig}`, cookie `telos_client_session`, `SameSite=None; Partitioned` for Whop iframe embedding.
- **Known pre-existing issues** (per CLAUDE.md, do NOT re-flag unless state changes):
  - `todayStr()` UTC timezone bug in client dashboard streak logic (client-side)
  - Tool pages missing `main.js`
  - `.html` extensions in some internal links
  - SW cache version bump pending
  - Whop iframe login does not work on Safari/iOS (third-party cookie policy)
- **Hot files for functional bugs**: `api/dashboard/clients.js`, `api/dashboard/client-portal.js`, `api/cron/*.js`, `api/client/login.js`, `api/client/reset-password.js`.
- **Redis key reservations**: `client_email:{normalized}` is a reservation record created on portal enable; deleting a client does NOT clean it up (see 2026-11-15 finding BH-003).

## Patterns to prefer

- Focus on data-integrity bugs around the `client_email:` reservation — it is touched by three code paths (`clients.js`, `client-portal.js`, deletion flow) and they are inconsistent.
- Crons call Redis in per-client `for` loops (`engagement-check`, `weekly-summary`). N+1 and sequential email sends; performance risk once client count passes ~50.
- `new Date(x).toISOString().split('T')[0]` is used server-side for "today" — this is UTC, not client local, and can cause off-by-one date keys around midnight UTC.

## False-positive patterns to avoid

(empty — build this up as denials come in)

## Signal quality notes

- Day 1 run: no decision history yet. Reports should err toward high-confidence, concrete, reproducible bugs with exact file:line anchors. Avoid stylistic / "could be cleaner" findings until we've earned trust.
