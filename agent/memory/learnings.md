# Bug Hunter Learnings

This file accumulates patterns the agent has learned across runs. Compress older entries when this file exceeds 2000 lines.

## Codebase shape (orientation)

- Pure HTML/CSS/JS frontend, no build step. Vercel serverless API in `/api/`. Upstash Redis is the only datastore.
- Two auth surfaces:
  - Admin (`/api/dashboard/*`): HMAC-signed cookie `telos_dash_session`, `SameSite=Strict`. All endpoints should call `verifySession` from `api/lib/auth.js`.
  - Client (`/api/client/*`): PBKDF2-hashed passwords, signed cookie `telos_client_session`, `SameSite=None; Partitioned` (intentional for Whop iframe — NOT a bug).
- Cron endpoints (`/api/cron/*`) gate on `Authorization: Bearer ${CRON_SECRET}`. Must fail closed if secret unset.
- Cookies on iframe-embedded client portal use `SameSite=None; Partitioned` because Whop embeds it; this is documented in CLAUDE.md and is intentional.

## Confirmed false-positive patterns (do NOT re-report)

- `SameSite=None` on `telos_client_session` — intentional for Whop iframe.
- Inline `<style>` blocks in `thomas.html`, `client-dashboard.html`, `chs.html` — intentional self-contained dashboard pattern.
- Public marketing pages loading `js/main.js` while admin/client dashboards do NOT — intentional.
- Em dashes are explicitly banned in CLAUDE.md — but reporting an em dash usage is a P3 polish item at most, not a bug.
- `body.page-load-anim` only on `index.html` — intentional opt-in.

## Patterns worth hunting next time

- Any endpoint under `/api/dashboard/*` or `/api/client/*` missing the auth check at top of handler.
- IDOR: client endpoints that read `clientId` from req.body / req.query rather than from the verified session.
- Public form endpoints (submit-quiz, submit-email, submit-chs-application, password reset, login) without rate limiting.
- innerHTML / outerHTML interpolating Redis content without escaping — Redis is admin-write but client-read in many flows.
- New cron jobs added without `CRON_SECRET` check.
- `localStorage.getItem` JSON parsed without try/catch (cosmetic, P3 only).

## Approval/denial history summary

(empty — first run)

## Run log

### 2026-04-27 — security (first run)

- Confirmed: every `api/dashboard/*` handler calls `verifySession`; every protected `api/client/*` handler calls `verifyClientSession`. No missing-auth bugs in current tree.
- Confirmed: no IDOR — `clientId` is always derived from the session, never from request body/query.
- Confirmed: PBKDF2(100k, SHA-512) for client passwords; HMAC-based admin auth; both use `crypto.timingSafeEqual`.
- Confirmed: cron endpoints fail closed when `CRON_SECRET` unset.
- Confirmed: no committed secrets; `food-search` proxy targets a hardcoded Open Food Facts URL (no SSRF).
- Established `ratelimit:` Redis idiom is the project's rate-limit pattern. Public submission endpoints use it; auth endpoints do not.
- Reported (3): missing rate limiting on `api/dashboard/login.js`, `api/client/login.js`, `api/client/reset-password.js`. All P1, all fixable with the existing limiter pattern.
- Did NOT report (kept for next time, low confidence today): timing-channel email enumeration in `api/client/login.js` between the early `client_email:*` miss branch and the full PBKDF2 path. Worth quantifying before flagging.
