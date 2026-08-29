# Bug Hunter Learnings

Accumulated patterns, gotchas, and false-positive filters. Updated at the end of every run.
Keep under 2000 lines; compress older entries into a summary when exceeded.

## Codebase orientation (bootstrapped 2026-08-29)

- Pure static HTML/CSS/JS (no build step). Serverless functions live under `/api/`.
- Two auth systems: admin session cookie (`telos_dash_session`, 2-part token, `SameSite=Strict`)
  and client session cookie (`telos_client_session`, 3-part token, `SameSite=None; Partitioned`
  to survive Whop iframe embedding).
- Data store is Upstash Redis via the REST client in `api/lib/redis.js`. Keys are documented
  in `CLAUDE.md`; treat that section as authoritative when checking for drift.
- Client dashboard and thomas dashboard are self-contained pages with all CSS/JS inline.
  Do NOT expect them to load `main.js` or `style.css`.

## Known backlog (per CLAUDE.md, do not re-report unless a NEW angle)

- Tool pages missing `main.js` on some paths.
- `.html` extensions leaking into some internal links.
- `todayStr()` UTC timezone bug in client dashboard streak calculations.
- Service worker cache version needs bumping.
- Whop iframe login broken on Safari/iOS (third-party cookie block; documented limitation).

## Reporting bar

- Every finding must cite `file:line`.
- Never re-flag a bug from the last 14 days without adding a new dimension.
- Zero-finding days are honest and valuable. Do not pad reports.

## False-positive patterns to avoid

- (none yet — populated from denials in `decisions.jsonl`)

## Run log

### 2026-08-29 (Functional, bootstrap run)

Areas confirmed clean (do not re-cover unless code changes):
- Auth checks: every `dashboard/*` and `client/*` data endpoint gates on the right
  session verifier. No IDOR in the reviewed handlers.
- Cron `CRON_SECRET` gating: fail-closed in both cron handlers.
- Public form → endpoint wiring: quiz, protein calc, hyrox, chs all point at
  endpoints that exist and rate-limit per-IP.
- Redis key drift: dashboard writer keys match client reader keys across all
  documented namespaces.

Patterns worth remembering:
- The repo has two auth libs. `client-auth.js` is the modern one (timing-safe,
  PBKDF2, SameSite=None+Partitioned); `auth.js` is older and slightly weaker.
  When reviewing auth-related code, check both against each other for regressions.
- Rate-limit pattern (INCR + EXPIRE per-IP) is spelled out three times in
  `api/submit-*.js`. Any *new* public POST endpoint that doesn't follow it is
  a legitimate finding.
- `verifyClientSession(req)` returns the client's own id — endpoints that derive
  their Redis key from it are IDOR-safe. Endpoints that read an id from
  request body/query are worth a look.
- The `todayStr()` UTC bug in `client-dashboard.html:1840` is real and affects
  ~26 downstream sites plus server-side defaults in six `/api/client/*.js` files.
  Fix will need coordinated client + server change.
