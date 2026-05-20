# Telos Bug Hunter — Learnings

Accumulated patterns, false-positive traps, and codebase notes. Compress when this file exceeds ~2000 lines.

## Codebase landmarks

- **Auth**: `api/lib/auth.js` (admin) and `api/lib/client-auth.js` (client portal). Cookies are HMAC-signed payloads — admin is 2-part (`expires.sig`), client is 3-part (`clientId.expires.sig`).
- **Rate limiting**: only on `/api/submit-quiz`, `/api/submit-email`, `/api/submit-chs-application`. Pattern is `INCR ratelimit:{ns}:{ip}` + `EXPIRE 3600`. Apply this template when checking other public POST endpoints.
- **Redis client**: `api/lib/redis.js` exposes `redis()` (throws on `data.error`) and `redisPipeline()` (does NOT throw — callers iterate `.forEach(r => r.result)`).
- **Date handling**: client dashboard's streak/today logic has a known UTC vs ET bug (documented in CLAUDE.md backlog). Cron jobs use `new Date(now - d * 86400000).toISOString().split('T')[0]` to derive date keys — UTC-rooted.
- **Email lookup**: `client_email:{normalizedEmail}` → `clientId`. Set ONLY when portal is enabled (`client-portal.js:117`). The duplicate check in `clients.js:70` therefore only catches conflicts among portal-enabled clients.
- **Vercel `cleanUrls: true`**: `.html` extensions in internal hrefs cause 308 redirects, not 404s. Known backlog item.

## Known issues (do NOT re-report)

- Tool pages missing `main.js` (CLAUDE.md backlog).
- `.html` extensions in internal links (CLAUDE.md backlog, 43 instances across blog + tool pages).
- `todayStr()` UTC timezone bug in client dashboard streak math (CLAUDE.md backlog).
- Service worker cache version bump needed (CLAUDE.md backlog).
- Whop iframe + Safari third-party cookie issue (CLAUDE.md known limitation).

## False-positive patterns to avoid

- Reporting cron timezone as a bug: cron `0 14 * * 1` UTC = 9am ET (winter) / 10am ET (summer) — CLAUDE.md says "Monday 9am ET" so the schedule is intentional, not buggy.
- Reporting `redisPipeline` lacking error throw as P0/P1: callers wrap in try/catch and return 500, so user impact is small.
- Reporting `x-forwarded-for` as a key without parsing comma list: Vercel terminates TLS and rewrites the header to a single trusted IP — spoofing isn't trivial.
- Reporting HMAC signature `!==` compare as P0: timing attacks on HMAC outputs over public internet are nearly infeasible in practice.

## Approval signals (update from decisions.jsonl)

- Empty. First run on 2026-05-20.
