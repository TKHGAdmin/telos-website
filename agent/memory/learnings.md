# Telos Bug Hunter — Learnings

Accumulated knowledge from past runs. Kept under 2000 lines; older entries get compressed as new ones arrive.

## Codebase map (learned 2026-09-24)

- Static HTML/CSS/JS site + Vercel serverless functions under `api/`. No build step.
- Shared inline patterns: `thomas.html`, `client-dashboard.html`, `chs.html` are self-contained (no shared JS/CSS), so `main.js` and `style.css` fixes don't reach them.
- Storage: Upstash Redis via REST (`api/lib/redis.js`). Client records are JSON blobs at `client:{id}`. Per-day telemetry is stored as one Redis key per (client, day) with a matching ZSET index.
- Auth: two independent cookie schemes — admin (`telos_dash_session`, HMAC + timing-safe password) and client (`telos_client_session`, PBKDF2 + HMAC, `SameSite=None; Partitioned` for Whop iframe). Sessions are 7 days.
- Public write endpoints (`api/submit-*.js`) are all `POST` with per-IP rate limits keyed on Upstash INCR. `x-forwarded-for` is trusted.
- Cron jobs live at `/api/cron/*` gated by `Bearer ${CRON_SECRET}`. Fail closed when secret unset, fail open (skipped) when `RESEND_API_KEY` unset.

## Patterns worth watching

- **Sibling data cleanup on client delete** — repeatedly a source of orphans. Any new "per client" Redis key added upstream needs a matching entry in `api/dashboard/clients.js` DELETE. Right now that handler cleans up nothing beyond `client:{id}` and `clients_index`.
- **Two-write mappings** (email → clientId, and any similar lookup): if one side writes it and another only reads it, uniqueness checks silently fail. See BUG-2026-09-24-003.
- **Cron idempotency** — Vercel crons fire whether or not the previous run finished the work. Every email-sending cron needs "have I already told this client today?" state. See BUG-2026-09-24-001.
- **UTC date bugs** — client dashboard uses `new Date().toISOString().split('T')[0]` as "today". Users west of UTC roll over hours late; already noted in `CLAUDE.md` known limitations, so don't re-report unless a new symptom surfaces.
- **SW cache growth** — `sw.js` caches every static GET forever, cache name `telos-v1` never bumped. `CLAUDE.md` calls this out under Known Limitations. Don't re-report.

## False-positive patterns to avoid

- **Shopify `descriptionHtml` injected via `innerHTML`** (`js/shop.js:199`) — technically an XSS vector, but the trust boundary is Thomas's own Shopify admin. Flag only if content comes from a third party.
- **Storefront API token in client JS** (`js/shop.js:15`) — this is the *Storefront* token, intended to be public. Not a leak.
- **`credentials: 'same-origin'` on client dashboard fetches** — fine because API calls are same-origin from the document even inside a Whop iframe; the cross-site cookie work is done via `SameSite=None; Partitioned` on the cookie itself.

## Focus rotation

Day 0 = Functional (2026-09-24, this run)
Day 1 = Visual/UX (next run)
Day 2 = Performance
Day 3 = Security
