# Telos Bug Hunter - Learnings

Accumulated knowledge across runs. Keep under 2000 lines; compress older entries if it grows.

## Codebase shape

- Pure HTML/CSS/JS, no build step. Vercel serverless functions in `api/`.
- Two auth systems: admin (`api/lib/auth.js`) and client (`api/lib/client-auth.js`). Both HMAC-signed cookies.
- Admin cookie `telos_dash_session` is SameSite=Strict. Client cookie `telos_client_session` is SameSite=None; Partitioned (iframe-friendly).
- Data store is Upstash Redis via REST. All endpoints call `redis(...)` or `redisPipeline([...])` from `api/lib/redis.js`.
- Index keys use ZSETs scored by timestamp (`clients_index`, `leads_index`, `chs_applications_index`, `quiz_submissions`, `client_X_logs_index:{clientId}`).
- Email-to-ID lookup pattern: `client_email:{normalizedEmail}` → clientId. Only written when portal is enabled (see 2026-10-03 BUG-02).

## Known limitations documented in CLAUDE.md (do NOT re-report)

- `todayStr()` returns UTC date in `client-dashboard.html` (line 1840), which misassigns logs for users in US timezones after ~7pm local.
- Tool pages missing `main.js` on some pages.
- `.html` extensions still present in some internal links.
- Service worker cache name needs a bump (`telos-v1`).
- Whop iframe on Safari/iOS: client cookies blocked.

## Patterns noticed (2026-10-03)

- Rate limiting is **inconsistent**: `submit-quiz`, `submit-email`, and `submit-chs-application` all rate-limit by `x-forwarded-for`, but `dashboard/login`, `client/login`, and `client/reset-password` have no rate limit at all. Login endpoints are the most abuse-prone.
- Rate limit key derivation uses raw `req.headers['x-forwarded-for']` without taking the first comma-separated entry. Any attacker-controlled XFF (direct-to-serverless) creates unlimited buckets.
- Error messages on `client/login` leak account state ("Portal access not enabled", "Account is not active", "Password not set"). Classic user enumeration.
- Admin HMAC verification in `auth.js` uses `!==` instead of `crypto.timingSafeEqual`; client HMAC verification does it correctly. Inconsistency.
- `clients.js` DELETE handler removes `client:{id}` and the index entry but NOT the `client_email:{email}` lookup, nor any derived data (daily logs, nutrition plan, training, etc.). Orphaned keys accumulate; email reuse is blocked.
- `client_email:` lookup is written only when portal is enabled, not on client create - creates a window where duplicate emails can slip past the create-time check if portal wasn't yet enabled on the first client.

## False-positive patterns to avoid

(none yet - populate from decisions.jsonl denials)

## Scope boundaries

- In scope: everything under `/home/user/telos-website` (Telos Fitness web platform).
- Out of scope: FORGE OS, run club site, any other Thomas-owned project.
