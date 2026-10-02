# Bug Hunter Learnings

Accumulated knowledge about the Telos Fitness codebase. Updated at the end of each run.

## Codebase shape (day 0 orientation)

- Pure static HTML/CSS/JS + Vercel serverless functions in `api/`.
- API families: `api/submit-*` (public, rate-limited), `api/dashboard/*` (admin cookie), `api/client/*` (client cookie), `api/cron/*` (CRON_SECRET bearer).
- Redis via Upstash REST (`api/lib/redis.js`), no npm deps.
- Admin auth: `telos_dash_session` cookie, HMAC-signed `{expires}.{sig}`, 7-day. SameSite=Strict.
- Client auth: `telos_client_session`, HMAC-signed `{clientId}.{expires}.{sig}`, 7-day. SameSite=None; Partitioned (needed for Whop iframe).
- Client IDs are integers from `INCR id:clients` - safe for `.`-delimited tokens.
- `CLAUDE.md` already documents a known P1-P3 backlog (April 2026 bug crawl) covering: tool pages missing `main.js`, `.html` extensions in internal links, todayStr UTC timezone bug in streaks, SW cache version bump. Do NOT re-report these - they are tracked.

## Known safe patterns (avoid false positives)

- `main.js` is intentionally absent from `thomas.html` and `client-dashboard.html` (both are self-contained dashboards). Not a bug.
- Tool pages (`protein-calculator.html`, `hyrox-predictor.html`) having their own inline hamburger script instead of `main.js` is in the April 2026 backlog - do not re-report.
- `?v=16` on `css/style.css` is the current cache-bust token across public pages. Only report if an edit to `style.css` lands without a bump.
- `Access-Control-Allow-Origin: *` on `api/submit-*` is intentional (public forms embedded on marketing pages).
- `verifyPassword` in `api/lib/auth.js` uses `timingSafeEqual` - do not flag as timing-attack.

## Rate-limit anti-patterns observed

- All `api/submit-*` endpoints and reset flows derive the rate-limit key from the raw `x-forwarded-for` header, which clients can prepend arbitrary values to on Vercel. Any new rate-limited endpoint should use the right-most IP from XFF, or `x-vercel-forwarded-for`, not the raw string.

## Cron idempotency

- Daily crons that trigger emails need a per-client "last sent" throttle, or they will spam. Weekly summary (Monday-only) is naturally throttled; engagement-check (daily) is not and currently can emit the same email every day while a client stays inactive. Flag any new daily cron that emits user-visible side effects without a throttle.

## Open Food Facts proxy

- `api/client/food-search.js` falls through `0`-truthy on per-serving kcal/macros, picking per-100g values instead of the actual zero. Edge-case for sugar-free gum, diet soda, etc. Low priority but noted.

## Future-run hygiene

- Keep this file under 2000 lines. Compress older sections into bullet summaries once that cap is approached.
- When a reported bug lands in `decisions.jsonl` as denied, append the pattern here under "Known safe patterns" so the next run won't re-report it.
- When reported bugs are marked `fixed`, note the commit SHA here so a stale report doesn't survive into a re-flag.
