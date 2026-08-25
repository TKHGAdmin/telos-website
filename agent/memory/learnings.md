# Telos Bug Hunter — Learnings

Accumulated knowledge from daily runs. Kept under 2000 lines; older entries compressed when needed.

## Codebase map (as of 2026-08-25)

- **Stack**: Pure HTML/CSS/JS static site + Vercel serverless functions. No build step. Redis (Upstash) for all persistence.
- **Auth**: Two separate cookie systems.
  - Admin (`telos_dash_session`): HMAC-signed `{expiry}.{signature}`. Timing-safe password compare in `api/lib/auth.js`. Signature compare uses raw `!==` (would need ~2^128 requests to matter — not worth flagging).
  - Client (`telos_client_session`): HMAC-signed `{clientId}.{expiry}.{signature}`. PBKDF2 100k iter SHA-512, timing-safe compare. `api/lib/client-auth.js`.
- **Redis fan-out per client**: A single client id maps to ~15 keys (`client:`, `client_email:`, `client_dailylog:*`, `client_training_log:*`, `client_nutrition_log:*`, `client_supplement_log:*`, `client_activity_log:*`, `client_545_*`, `client_push_sub:*`, `client_nutrition_plan:*`, `client_mindset:*`, `client_resources:*`, `client_sidemenu:*`, `client_supplement_plan:*`, `client_training_program:*`). Any per-client cleanup must sweep all of them.
- **Rate limits**: Only three endpoints have any rate limit today (submit-quiz, submit-email, submit-chs-application). All key on raw `x-forwarded-for` which can be spoofed. Login and reset endpoints have none.
- **Cron**: Two endpoints (`weekly-summary`, `engagement-check`). Both gate on `Bearer <CRON_SECRET>`. Fail closed when secret missing.
- **Push notifications**: `api/client/notify.js` is a documented placeholder — real Web Push (RFC 8291) not implemented; POSTs raw JSON to endpoint without VAPID encryption. Known-incomplete, don't re-flag unless spec landed.

## Explored on 2026-08-25 (Functional focus)

- All admin CRUD endpoints under `api/dashboard/` (clients, pipeline, chs-applications, client-portal, revenue).
- All auth libraries (`lib/auth.js`, `lib/client-auth.js`).
- Client login + reset-password flows.
- Public submit endpoints (quiz, email, chs application).
- Cron jobs (weekly-summary, engagement-check).
- Not yet explored: quiz.js frontend logic, shop.js cart logic, blog articles, service worker cache invalidation, main.js scroll/nav behavior, thomas.html + client-dashboard.html inline scripts.

## Patterns worth remembering

- **Delete-without-fan-out risk**: `api/dashboard/clients.js` DELETE only clears the primary record + index. All other per-client keys and the `client_email:` lookup persist. Same pattern to check on any future entity that gets fan-out storage (leads, chs-applications, modules).
- **Rate-limit key sourcing**: `x-forwarded-for` on Vercel gets prepended with the real client IP but the client's own value is included in the chain. Any code that uses the raw header as an identity key is bypassable. Prefer `x-real-ip` (Vercel-set, not client-modifiable).
- **Email interpolation in emails**: `weekly-summary.js` and `reset-password.js` interpolate `firstName` into email HTML without escaping. The recipient controls their own name via admin, so it's self-XSS-adjacent rather than exploitable. Note the class of issue if a similar pattern appears with untrusted input.

## False-positive patterns to avoid

- Do NOT re-flag known-incomplete features documented as such (e.g. `notify.js` VAPID placeholder).
- Do NOT flag stylistic non-timing-safe compares on HMAC output — the attack cost is astronomical and this comes up on nearly every review.
- Do NOT flag `.html` extensions in internal blog links or the `todayStr()` UTC timezone bug in the client dashboard — both are documented in CLAUDE.md as known P1-P3 backlog.

## Decisions log status

- `decisions.jsonl` is empty as of the first run. Approval/denial signal will start accruing after Thomas triages this report.
