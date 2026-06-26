# Agent Learnings

Running log of patterns the Telos Bug Hunter has learned. Append new entries to the bottom; compress when this file exceeds 2000 lines.

## 2026-06-26 (first run)

### Codebase map
- Static HTML/CSS/JS site on Vercel with a thin layer of serverless functions in `api/`.
- Admin dashboard (`thomas.html`) and client PWA (`client-dashboard.html`) are self-contained single-file apps that do not load `js/main.js` or `css/style.css`. Don't apply "shared CSS" patterns to them.
- Cron jobs (`api/cron/weekly-summary.js`, `api/cron/engagement-check.js`) are gated by `Bearer ${CRON_SECRET}`.
- Admin sessions use 2-part HMAC tokens; client sessions use 3-part `{id}.{expiry}.{sig}` tokens with `SameSite=None; Partitioned` for Whop iframe support.
- All client per-day data lives in `client_*:{clientId}:{YYYY-MM-DD}` keys plus a `client_*_index:{clientId}` ZSET.

### Patterns to keep hunting for
- **Cron jobs without dedup/cooldown markers** -> any handler that decides "should I email this client today?" based purely on activity tied to dates the user controls will re-fire forever. Verify each cron sets a per-client throttle key after sending.
- **DELETE endpoints in `api/dashboard/`** -> several store keys are documented in `CLAUDE.md` but the DELETE handlers only remove the primary record and a single index. Always cross-check against the Redis-keys block in `CLAUDE.md`.
- **Auth endpoints without rate limits** -> the public submission endpoints all use a `ratelimit:*:{ip}` `INCR+EXPIRE` pattern; copy that pattern when login/reset endpoints don't have it.
- **Login error message granularity** -> any login handler that returns different strings for "no user" vs "wrong password" vs "deactivated" is an enumeration oracle.
- **Mobile-menu drift after desktop nav refactors** -> when items move into a desktop dropdown, the corresponding `mobile-dropdown` block has to be added on every page that already has its own self-contained nav (shop, product, chs, pricing, tools).
- **Timezone bugs in date-keyed cron jobs** -> client writes `body.date` in their local TZ; cron computes `new Date(now - d*86400000).toISOString().split('T')[0]` in UTC. The off-by-one is bounded to 1 day but can matter for streaks/scoring.

### Known false-positive patterns (do not re-report)
- The Shopify Storefront token in `js/shop.js` is intentionally public. Don't flag as exposed credential.
- `verifyToken` in `api/lib/auth.js` using `===` for HMAC comparison: theoretically not timing-safe, but the timing channel against HMAC over the network is impractical. Mention in Notes, don't file as a bug.
- Tool pages missing `js/main.js` (`protein-calculator.html`, `hyrox-predictor.html`): already in the CLAUDE.md P1-P3 backlog. Skip unless something new compounds it.
- `body.page-load-anim` only on `index.html`: intentional per CLAUDE.md.

### Files most likely to harbor bugs (current snapshot)
- `api/cron/engagement-check.js`, `api/cron/weekly-summary.js`
- `api/dashboard/clients.js` (DELETE in particular)
- `api/client/login.js`, `api/dashboard/login.js`
- New code paths: `shop.html`, `product.html`, `js/shop.js`, anything else added in the recent shop/product/cart commits.

### Process notes
- The agent directory tree did not exist on first run; bootstrapped `agent/memory/`, `agent/reports/`, `docs/BUG_REPORT_SCHEMA.md`. Future runs should find them.
- `decisions.jsonl` is empty -> no approve/deny signal yet. Stay conservative; prefer four high-confidence bugs over twelve speculative ones.
