# Terminex Bug Detector - Accumulated Learnings

This file is the agent's memory across daily runs. Keep under 2000 lines; compress older entries when it grows.

## Codebase anatomy

- **Repo**: `tkhgadmin/telos-website` (pure HTML/CSS/JS, Vercel serverless + Upstash Redis).
- **Auth libraries**: `api/lib/auth.js` (admin, HMAC token, single password) and `api/lib/client-auth.js` (per-client, PBKDF2+HMAC token with clientId embedded). The client version is more carefully written than the admin version - watch for drift between the two.
- **Known convention**: Every `api/dashboard/*.js` must call `verifySession(req)` first. Every `api/client/*.js` must call `verifyClientSession(req)` first, except: `login.js`, `logout.js`, `reset-password.js`, and the two admin-authed endpoints (`notify.js`, `send-email.js`) which use `verifySession` instead.
- **Known convention**: Form submission endpoints under `/api/submit-*` are intentionally CORS-open (`Access-Control-Allow-Origin: *` in `vercel.json`) and use IP-based Upstash INCR rate limits.
- **PWA cookies**: Client cookie is `SameSite=None; Partitioned` to support Whop iframe embed. Admin cookie is `SameSite=Strict`.
- **noindex**: Both dashboards carry `<meta name="robots" content="noindex, nofollow">`. Fine.

## Known limitations documented in CLAUDE.md (do NOT re-report)

- Whop iframe on Safari/iOS blocks client cookie - architectural, not a bug.
- `todayStr()` UTC timezone bug in client-dashboard.html (line 1840) - documented in the P1-P3 backlog section of CLAUDE.md.
- Tool pages missing main.js - documented in the P1-P3 backlog.
- `.html` extensions in internal links - documented.
- SW cache version bump needed - documented.

## Patterns observed

- `innerHTML` is used liberally in `client-dashboard.html` (67 call sites) but almost always with values that pass through the `esc()` helper (line 1831) or are rendered from literal strings. The one coach-controlled HTML sink is `drawerCustomContent` at line 2749, which takes `item.content` from the side-menu config - admin-only input, so lower risk, but worth revisiting if the admin ever becomes multi-tenant.
- Rate limiting is implemented well on form submission endpoints but completely absent on auth endpoints. This is the single biggest gap in the security posture.
- The admin DELETE on `/api/dashboard/clients` does not cascade-delete related keys (`client_email:*`, `client_dailylog:*`, etc.) - orphaned data. P3-grade, not reported in this run.

## False-positive patterns to avoid

- Do not re-report items already in the CLAUDE.md "Known Limitations" or P1-P3 backlog.
- Do not flag `innerHTML` writes whose argument is a literal string or passes through `esc()`.
- Do not flag CORS wildcards on `/api/submit-*` - intentional for marketing forms.
- Do not flag the `SameSite=None` on the client cookie - required for Whop iframe.
- Do not flag the single `DASHBOARD_PASSWORD` design - it is a one-admin product by design.

## Run history

- **2026-10-22 (Security, first run)**: 5 findings. Rate limiting absent on auth endpoints (P1), password reset doesn't invalidate sessions (P1), timing-based email enumeration on reset (P1), non-timing-safe admin HMAC compare (P2), no clickjacking protection on /thomas (P2).
