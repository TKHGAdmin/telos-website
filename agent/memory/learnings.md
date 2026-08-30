# Bug Hunter Learnings

Living notes about the Telos codebase and this agent's own calibration. Written for the next run of the agent (a fresh Claude), not for Thomas.

## Codebase shape

- Pure HTML/CSS/JS, no build step. Server logic lives entirely under `api/` as Vercel serverless functions.
- Two auth systems: admin (`api/lib/auth.js`, cookie `telos_dash_session`, `SameSite=Strict`) and client (`api/lib/client-auth.js`, cookie `telos_client_session`, `SameSite=None; Partitioned` for Whop iframe support).
- Storage: Upstash Redis (REST). No SQL. Keys are string-formatted (see `CLAUDE.md`).
- Client data uses a "coach-set / client-logged" split: `client_<thing>_plan:{id}` (coach content) vs `client_<thing>_log:{id}:{YYYY-MM-DD}` (per-day client entries), with a `ZSET` index tracking dates.
- Dashboards (`thomas.html`, `client-dashboard.html`) are large monolithic files with inline `<style>` and `<script>`. They do NOT load shared `js/main.js` or `css/style.css`.

## Codebase patterns worth remembering

- Every public POST endpoint should rate-limit by IP with `ratelimit:<name>:<ip>` (1-hour bucket). Look for this pattern; missing it is a real finding.
- Every admin endpoint should start with `if (!verifySession(req)) return 401`. Every client endpoint should start with `var clientId = verifyClientSession(req);` and 401 if falsy. `send-email.js` and `notify.js` are ADMIN endpoints despite living under `api/client/` (they take a `clientId` argument).
- Both cron endpoints (`api/cron/*.js`) fail closed if `CRON_SECRET` is unset (good — do not flag as a bug).
- Redis writes for client identity are split between two files: `api/dashboard/clients.js` (create/update/delete client record) and `api/dashboard/client-portal.js` (enable/disable portal, set password, maintain `client_email:<normalized>` lookup). This split is the source of several bugs — always trace both when reviewing client identity flows.

## Confirmed real bugs (as of 2026-08-30)

Do not re-report these unless a subsequent report says they are fixed and you find a regression.

- `api/lib/auth.js:27` — non-timing-safe HMAC signature check for admin session cookies. `client-auth.js` gets it right; admin does not. Fix: `crypto.timingSafeEqual` on hex buffers of equal length.
- `api/dashboard/clients.js:143-153` — DELETE handler removes the client record and `clients_index` entry but does NOT remove `client_email:{normalizedEmail}` or any of the per-client data namespaces (`client_dailylog:*`, `client_training_log:*`, etc.). Storage leak plus a "email already in use" false positive when a new client is created with the same address.
- `api/dashboard/clients.js:70` + `client-portal.js:117` — email uniqueness on client CREATE is only meaningful after portal is enabled (that's when the `client_email` index is written). Two clients can be created with the same email; enabling portal on the second one silently overwrites the first's login mapping (SET, not SETNX).
- `api/submit-quiz.js:23`, `api/submit-email.js:28`, `api/submit-chs-application.js:40` — rate-limit key uses the raw `x-forwarded-for` header. Trivially bypassable by rotating the client-supplied portion; Vercel appends the real client IP, so the whole string varies per attacker whim.

## False-positive patterns to avoid

- The `/client-dashboard?reset=<token>` handler DOES exist (init() at line ~5190 branches to `showView('reset')` and `handleReset` at line ~1993 POSTs to `/api/client/reset-password`). Do not flag this as missing.
- `notify.js` and `send-email.js` under `api/client/` are gated by admin `verifySession` — this is by design (admin sends to a specific client). Do not flag as "client endpoint without client auth".
- Both cron handlers return 200 with `skipped: true` when `RESEND_API_KEY` is unset. This is a deliberate graceful degrade, not a silent failure.
- `send-email.js` custom template injects `body.html` directly into the outbound email HTML — this is fine because the sender is authenticated as admin and the recipient is a Telos client email box, not a browser.
- `submit-email.js` uses `.includes('@')` for validation while `submit-chs-application.js` uses a regex. Style inconsistency, not a bug.

## Areas not yet explored

- Blog HTML files (23 in `/blog/`) — never scanned for XSS or dead nav links.
- `js/main.js`, `js/quiz.js` — client-side logic, not yet audited.
- `sw.js` — service worker cache invalidation logic.
- `thomas.html` inline JS — 160k+ line file, only spot-checked.
- `client-dashboard.html` inline JS beyond auth/reset paths.
- Push notification implementation in `notify.js` — noted as "simplified"/"placeholder", full RFC 8291 not implemented but this is admin-facing, not user-facing.

## Approval rate

Not yet measurable — this is the first report. Start conservative, prefer P1/P2 with concrete evidence over volume.
