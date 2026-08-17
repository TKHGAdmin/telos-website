# Bug Hunter — Accumulated Learnings

Living document. Each daily run appends observations here and prunes obsolete ones. Keep under 2000 lines.

## Codebase orientation

- **Stack**: pure HTML/CSS/JS, no build. Vercel serverless functions in `api/`. Upstash Redis via REST for storage.
- **Two auth systems**: admin (`api/lib/auth.js`, cookie `telos_dash_session`, 2-part token) and client (`api/lib/client-auth.js`, cookie `telos_client_session`, 3-part token). Do NOT conflate them.
- **Sensitive endpoints**: everything under `api/dashboard/*` must call `verifySession` from `lib/auth`. Everything under `api/client/*` must call the client equivalent from `lib/client-auth`. Cron endpoints must check `CRON_SECRET`.
- **Public endpoints**: `submit-quiz.js`, `submit-email.js`, `submit-chs-application.js`. These should have some form of rate limiting (chs-applications explicitly does).

## Known limitations (per CLAUDE.md — do NOT re-report as bugs)

- Whop iframe login on Safari/iOS is a known cookie-blocking limitation. Not a bug.
- The bug crawl P1-P3 backlog from April 2026 is tracked in commit 7fa38ff. Known items:
  - Tool pages missing main.js
  - `.html` extensions in some internal links
  - `todayStr()` UTC timezone bug in client dashboard streaks
  - Service worker cache version bump needed
- These are known — do not re-report unless they've regressed further or a new manifestation appears.

## False-positive patterns to avoid

- **"Missing try/catch"** on already-guarded external calls is usually noise. Check whether the outer request handler already returns 500 on throw.
- **"Missing input validation"** on fields the UI constrains is only worth reporting if the endpoint is publicly reachable AND the missing check has a real downstream consequence (crash, injection, wrong data written).
- **"Redis key could collide"** on well-namespaced keys (e.g. `client_dailylog:{clientId}:{date}`) is not a real bug — the namespace prevents collisions.
- **"Could use const instead of let"** — style, not a bug. Never report.
- **"No unit tests"** — architectural, not a runtime bug. Never report.

## Patterns worth remembering

- Timing-safe password comparison is already present in admin auth (`crypto.timingSafeEqual` — verified in `api/lib/auth.js`). Don't re-report as missing.
- Client cookie uses `SameSite=None; Partitioned` INTENTIONALLY for Whop iframe support. Not a security bug.
- Charleston application endpoint has intentional rate limiting via `ratelimit:chs:{ip}` — verified pattern.

## Coverage log

Track which files have been inspected each day so we can rotate targets and avoid pounding the same ground.

| Date | Focus | Files/systems inspected | Bugs filed |
|---|---|---|---|
| 2026-08-17 | functional | `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`, all of `api/dashboard/*`, all of `api/client/*`, `api/cron/*`, all three public `submit-*.js`, `vercel.json`, `manifest.json`, `sw.js` | 6 (1 P1, 4 P2, 1 P3) |

## Findings from 2026-08-17 (first run)

Patterns worth carrying forward:

- **Session revocation is only enforced at login**, not on subsequent requests. Any auth pattern where the token has a long TTL and no per-request DB check has the same lifecycle risk (bug 01). When reviewing any new client endpoint, ask: what happens if the coach disables this client's portal right now?
- **The reverse-lookup key `client_email:{normalizedEmail}`** is written by the portal-enable flow and cleaned up by the PUT-email-change flow, but NOT by DELETE (bug 02). Any future "delete" or "archive" flow on a client-adjacent record with a reverse-lookup key needs to clean up both sides.
- **ZSET score staleness on PUT** — `adspend.js` and `content.js` both have this pattern (bug 03 is adspend; content's is not user-visible per hunter). Whenever an admin PUT can change a field used as a ZSET score (usually `date` or `scheduledDate`), the handler needs a matching `ZADD` with the recomputed score.
- **Rate-limiting is inconsistent** — the three `submit-*` handlers all rate limit; the two `login.js` files and `reset-password.js` do not (bugs 04, 05, 06). This is a coherent gap. Whenever a new endpoint that touches auth or a paid third-party API (Resend, Blob, Vercel Analytics) is added, check for a `ratelimit:*` key.

Notes on triage:

- Bugs of the form "endpoint X lacks input validation" are usually noise if the endpoint is admin-only. Only surface if the endpoint is public OR the missing check has a concrete downstream consequence (crash, corruption, injection).
- Do NOT re-report the `!==` HMAC comparison in `api/lib/auth.js:27` — verified not practically exploitable.

## Reminders for tomorrow (visual-ux)

- Load the live production pages via WebFetch (mobile UA + desktop UA) rather than just reading the HTML files, so responsive breakpoints and cross-page nav are actually seen.
- Check that every page listed in `CLAUDE.md → Project Structure` loads `js/main.js` if it's a public marketing page. Tool pages missing `main.js` is a known backlog item (per CLAUDE.md), but any NEW page missing it is a fresh regression.
- Look at `client-dashboard.html` on a narrow viewport (375px width) — the FAB button, the modals, the training accordion are the highest-risk components.
- Check `chs.html` on mobile — the magazine-style asymmetric layout is the biggest visual-risk page.
