# Bug Hunter Learnings

Accumulated knowledge that survives across runs. Updated at the end of each hunt.

## Repo shape (as of 2026-08-10)

- Pure HTML/CSS/JS site, no build step. Vercel serverless functions in `api/**`.
- Persistence: Upstash Redis via a hand-rolled REST client in `api/lib/redis.js` (no npm dep).
- Two auth flows, two cookies:
  - Admin `/thomas`: `telos_dash_session`, HMAC-signed, `SameSite=Strict`, `api/lib/auth.js`.
  - Client `/client-dashboard`: `telos_client_session`, HMAC-signed with clientId embedded, `SameSite=None; Partitioned` (for Whop iframe), `api/lib/client-auth.js`.
- Public write endpoints under `api/submit-*.js` are the only ones with rate limits.
- Cron jobs live under `api/cron/*` and require `CRON_SECRET` in `Authorization: Bearer ...`.

## Patterns worth remembering

- **Rate-limit keys use raw `x-forwarded-for`.** All three public submit endpoints do `req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'` as-is. On Vercel this can be a comma-separated chain, and callers can prepend their own token to shift the key. Prefer the first token or `x-real-ip`.
- **Client `client_email:{normalizedEmail}` lookup is written only when the portal is enabled** (`api/dashboard/client-portal.js`). It is NOT cleaned up when a client is deleted (`api/dashboard/clients.js` DELETE), so re-creating a client with the same email fails at the duplicate-email check.
- **Admin `verifyToken` uses a non-constant-time compare on the HMAC signature** (`api/lib/auth.js:27`) while the client version uses `timingSafeEqual`. Realistic exploitability is very low, but the inconsistency is worth flagging if today's focus is security.
- **Admin login has no rate limit.** `/api/dashboard/login` returns 401 with no lockout, counter, or backoff. It gates the whole business dashboard (clients, revenue, all Redis data).
- **Client login and password-reset also have no rate limit.** Reset can be spammed to a client inbox / Resend quota; login is brute-forceable.
- **Email HTML is templated as raw string concatenation** in `api/client/reset-password.js`, `api/client/send-email.js`, `api/cron/weekly-summary.js`, using `client.name` (coach-controlled) without escaping. Low risk because the coach sets names, but keep an eye if a self-serve name flow ever appears.
- **Emails/quiz stored as ZSET members with JSON body.** Duplicate rows possible; timestamp is the score. Not a bug in itself, but watch for issues if ever migrating.

## False-positive traps to avoid

- Do not report "consider using an ORM/prepared statements" - the Redis client uses REST, not SQL.
- Do not report timing-safe compares for the client HMAC - it already uses `timingSafeEqual`.
- Do not report missing CSRF on `/api/client/*` - the cookie is `SameSite=None; Partitioned` intentionally for Whop iframe embedding; a proper fix here needs a design conversation, not a one-line bug.
- Do not report "no HTTPS" - Vercel forces HTTPS.
- Do not report missing `alt` on decorative brand icons that are `aria-hidden`.

## Explored corners

- `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`
- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`
- `api/dashboard/login.js`, `api/dashboard/clients.js`, `api/dashboard/client-portal.js`
- `api/client/login.js`, `api/client/reset-password.js`, `api/client/daily-log.js`, `api/client/nutrition-log.js`, `api/client/food-search.js`, `api/client/send-email.js`
- `api/cron/weekly-summary.js`
- `vercel.json`

## To-explore next runs

- Front-end quiz flow (`js/quiz.js`) and pricing gate logic
- `js/main.js` scroll/animation handlers (visual/UX focus day)
- Blog article HTML for accessibility / meta issues (visual/UX focus day)
- Bundle sizes and image weights (performance focus day)
- `api/dashboard/upload-video.js` and Blob token handling (security focus day)
- `api/client/notify.js` + push subscription lifecycle
- `api/dashboard/analytics.js` Vercel token handling
