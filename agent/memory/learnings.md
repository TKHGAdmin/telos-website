# Bug Hunter Learnings

Accumulated patterns, codebase knowledge, and false-positive rules.

## Codebase shape (as of 2026-05-07)

- Pure HTML/CSS/JS, no build step. Vercel-hosted with serverless functions in `api/`.
- Two auth realms: admin (`telos_dash_session` cookie, password-only) and client (`telos_client_session` cookie, email + password). Helpers in `api/lib/auth.js` and `api/lib/client-auth.js`.
- Storage is Upstash Redis only - no SQL, no ORM. Keys documented in CLAUDE.md.
- `esc()` helper exists in both `thomas.html` and `client-dashboard.html` and uses textContent->innerHTML pattern (safe). It is consistently used around dynamic strings rendered via `innerHTML`.
- CORS is wide-open (`*`) only on `/api/submit-*` endpoints (configured via vercel.json header rule).
- Rate limiting on public endpoints: keyed on `x-forwarded-for || x-real-ip`. Limits: quiz 10/hr, email 10/hr, chs-application 5/hr.
- Cron jobs require `Bearer ${CRON_SECRET}` header.

## Heuristics

- An admin-trusted code path that interpolates admin-set strings into client HTML is a real privilege concern but should generally be P3 unless admin compromise is plausible (e.g. dashboard exposed without 2FA, weak password). Note it; don't oversell it.
- Length-leak via early-return before `crypto.timingSafeEqual` is a known pattern. Worth flagging at P3, not higher - timing channels over the public internet are extremely hard to exploit at byte-level granularity.
- Missing rate limit on auth endpoints (login, password reset) is consistently P1-P2 because brute-force is well within reach for online attacks.
- `req.headers['x-forwarded-for']` on Vercel returns the full chain (`client-spoofed, real-ip`). Using the raw value as a rate-limit key is bypassable. Vercel exposes the real client IP as `x-real-ip`; prefer that or parse `xff[0]`.

## False-positive patterns to skip

- `innerHTML` use that always wraps strings with `esc()` is fine.
- Hardcoded Vercel project IDs in `analytics.js` are not secrets.
- Missing CSRF tokens on cookie-auth POSTs are mitigated by `SameSite=Strict` (admin) and the lack of cross-origin-writable forms; do not flag generically.

## Open questions for future runs

- Is admin 2FA planned? If not, a single-password admin login is the weakest link and missing rate limit there is more urgent.
- Should client login lock accounts after N failures or just IP-rate-limit? Account lockout opens a denial-of-service vector against a known-email victim.
