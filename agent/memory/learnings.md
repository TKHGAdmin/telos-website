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
