# Bug-Hunter Learnings

Accumulated patterns, dead-ends, and codebase notes. Trimmed if this exceeds 2000 lines.

## Codebase orientation

- **Stack:** vanilla HTML/CSS/JS + Vercel serverless functions (Node, CommonJS via `require`, not ESM). No build step. No test suite.
- **State:** Upstash Redis via `api/lib/redis.js` (REST-based, `redis()` and `redisPipeline()` helpers).
- **Auth:** two independent systems.
  - Admin: `api/lib/auth.js`, single shared `DASHBOARD_PASSWORD`, cookie `telos_dash_session`, token = `{expiry}.{hmac}`, `SameSite=Strict`.
  - Client: `api/lib/client-auth.js`, per-client PBKDF2(100k, SHA-512), cookie `telos_client_session`, token = `{clientId}.{expiry}.{hmac}`, `SameSite=None; Partitioned` (for Whop iframe).
- **Emails:** Resend (`RESEND_API_KEY`). Sender `noreply@telosathleticclub.com`.
- **Crons:** `weekly-summary` (Mon 9am ET), `engagement-check` (daily). Both `Authorization: Bearer ${CRON_SECRET}` — fail-closed if secret unset.
- **Known limitation (per CLAUDE.md):** Whop iframe login on iOS Safari doesn't work — third-party cookies blocked regardless of SameSite. Not a bug, a browser policy. Don't re-report.

## Patterns that are real bugs

- **Rate-limit drift.** Public write endpoints have Redis-INCR rate limits; auth-adjacent endpoints (login, reset-password) don't. Any new `POST` that touches Redis, Resend, or PBKDF2 needs one.
- **Redis key lifecycle gaps.** Deletes of parent records (`client:{id}`, `chs_application:{id}`) often leave orphaned lookup / index / per-day keys. Grep for every place a key is CREATED, then confirm every DELETE path clears them. `client_email:{email}` is a documented example.
- **Cron idempotency gaps.** `engagement-check.js` re-sends every day it runs — there's no cooldown state per client. Any recurring-email cron needs a sent-marker with a TTL.

## Patterns to NOT re-report (false positives / accepted tradeoffs)

- **`x-forwarded-for` used unsplit for rate-limit keys.** Trivially bypassable by rotating the header, but the per-IP limit was best-effort anyway. Not worth reporting on a Functional day. Might revisit on Security day only if the endpoint is high-value.
- **`data-variant-id="${variant.id}"` in inline `onclick`** on shop pages. Shopify GraphQL IDs are safe characters (`gid://shopify/ProductVariant/{numeric}`). No injection risk. Do not flag.
- **`SHOPIFY_STOREFRONT_TOKEN` visible in `js/shop.js`.** Storefront tokens are intentionally public — designed to be embedded in browser code, scoped to read-only Storefront API. Not a leaked secret.
- **Admin `verifyToken` uses `!==` instead of `crypto.timingSafeEqual`** (`api/lib/auth.js:27`). Real inconsistency, but HMAC signature is fixed-length uniformly-random hex. Not a Functional-day report; borderline for Security day.

## Codebase areas explored (so I don't re-scan them cold)

- 2026-08-13: All `api/` endpoints (submit-*, dashboard/*, client/*, cron/*), `api/lib/*`, `js/shop.js`. Not yet: `js/main.js`, `js/quiz.js`, client-dashboard.html internals, blog HTML, thomas.html.

## Meta

- **Schema:** `docs/BUG_REPORT_SCHEMA.md` referenced by `AGENTS.md` does not exist in the repo. Currently writing reports in a sensible default layout; will migrate to the schema once Thomas creates it.
- **Approval feedback loop:** `decisions.jsonl` is empty at time of first run. First few reports will be defensive/conservative. Expect precision > recall until signal starts arriving.
