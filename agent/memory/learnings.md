# Telos Bug Hunter - Learnings

## Codebase map (run 1, 2026-07-09)

- **Stack**: pure static HTML + Vercel serverless functions. No build step, no npm test suite. Static analysis and code trace are the primary hunting tools.
- **API entry points**: `api/*.js` (public), `api/dashboard/*` (admin, `verifySession`), `api/client/*` (client portal, `verifyClientSession`), `api/cron/*` (Vercel cron, `CRON_SECRET`).
- **Data store**: Upstash Redis via REST. All writes are single-key SET/DEL/ZADD; there is no MULTI/EXEC or WATCH anywhere in the code, so any read-modify-write of the same key from two concurrent requests can lose an update.
- **Auth surfaces**:
  - Admin: `telos_dash_session` cookie, HMAC over expiry only. Signature check is **string `!==`** (non-timing-safe). Cost of forging is still infeasible without SESSION_SECRET.
  - Client: `telos_client_session` cookie, HMAC over `{clientId}.{expiry}`. Signature check uses `crypto.timingSafeEqual`. Password hashing is PBKDF2-SHA512, 100k iters, per-user salt.
- **Email + login lookups**: `client_email:{normalizedEmail} -> clientId` mapping is written by `client-portal.js` (portal enable) and `clients.js` PUT (email change), but **never cleaned up on client DELETE** (see report 2026-07-09).
- **Rate limiting**: only `/api/submit-*` endpoints and email captures rate-limit. Client `/api/client/login`, `/api/client/reset-password`, and admin endpoints have none.

## Known documented issues (do NOT re-flag)

From `CLAUDE.md` "Known Limitations" and P1-P3 backlog referenced in commit `7fa38ff`:
- Whop iframe login fails on Safari/iOS (third-party cookies).
- Tool pages missing `main.js`.
- `.html` extensions in internal links (45 occurrences across 30 files — style, not broken).
- `todayStr()` uses UTC → streak/date drift near midnight for non-UTC users.
- Service worker cache version bump needed when static assets change.

## Novel patterns worth watching

- **Push notify (`api/client/notify.js`) is unimplemented**: raw POST to the push endpoint with no VAPID JWT and no RFC 8291 payload encryption. FCM/Mozilla/Apple reject those. The handler returns `200 ok:true` (with a "delivery uncertain" warning field) even on failure — admin dashboard cannot tell a notification actually landed. Not filed as a bug this run because the file itself openly documents the limitation; treat as known scaffolding, not a regression.
- **Shopify description HTML** flows into `descEl.innerHTML` at `js/shop.js:199` unsanitized. Shopify admins are trusted, so this is not a functional bug; noted as a Security-focus candidate for a future rotation.
- **Client record read-modify-write** happens in many places (login, portal, push-subscribe, clients PUT). Last write wins. Real-world impact is low because the admin is usually the only mutator, but noted.

## False-positive patterns to avoid

- Anything the CLAUDE.md "Known Limitations" section already lists.
- Style-only bikeshedding (naming, formatting, "code could be cleaner").
- Race conditions that require concurrent admin actions — mention once here, don't re-file per endpoint.
