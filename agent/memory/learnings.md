# Bug Hunter Learnings

Accumulated knowledge across runs. Append new entries; compress older ones once this file exceeds 2000 lines.

---

## 2026-05-06 (first run)

### Architecture notes (codebase orientation)
- Pure HTML/CSS/JS site, no build step. Vercel-hosted, with serverless functions in `/api/`.
- Two distinct auth flows:
  - **Admin** (`/thomas`): `api/lib/auth.js`, single password from `DASHBOARD_PASSWORD` env, HMAC-signed `telos_dash_session` cookie, `SameSite=Strict`.
  - **Client** (`/client-dashboard`): `api/lib/client-auth.js`, PBKDF2 hashed per-client passwords, HMAC-signed `telos_client_session` cookie, `SameSite=None; Partitioned` (for Whop iframe embed).
- Shared session secret: `SESSION_SECRET` env var (used by both auth flows).
- All persistence is Upstash Redis via REST helper `api/lib/redis.js` - no SDK, plain `fetch` calls. No SQL.
- Two cron jobs registered in `vercel.json`:
  - `weekly-summary` (Mondays 14:00 UTC)
  - `engagement-check` (daily 15:00 UTC)
  - Both gated on `Bearer ${CRON_SECRET}` auth header.
- Lead-capture funnels feed Redis sorted sets keyed by timestamp (`quiz_submissions`, `email_protein_calculator`, `email_hyrox_predictor`, `chs_applications_index`).
- Public POST endpoints have IP-based hourly rate limits (`ratelimit:*:{ip}` Redis counters) - **except** `api/client/reset-password.js` which has none. Worth re-verifying any new public endpoint follows the same pattern.

### Patterns / smells worth checking each run
- **Submit buttons typed as `type="button"` with `addEventListener('click', preventDefault)`** completely bypass HTML5 `required` validation. Found this on the quiz lead capture (BUG-2026-05-06-01). When auditing forms, always check the button type and the handler's event name.
- **Daily crons that mutate user-visible state without de-dup** (BUG-2026-05-06-02). Audit any new cron for "have we already done this today/this week" tracking.
- **Public endpoints that trigger emails or external API calls** (Resend, Open Food Facts proxy) need rate limits. The codebase has a consistent `ratelimit:{kind}:{ip}` pattern that any new endpoint should adopt.
- `api/lib/auth.js` `verifyPassword` has a theoretical fail-open if `DASHBOARD_PASSWORD` env var is unset AND attacker sends `password: []` (empty array bypasses the `!password` truthy check, then length-0 buffer compares equal to length-0 expected). Not currently exploitable in production but defense-in-depth issue. Skipped this run as too speculative; revisit if env hygiene becomes a concern.
- The admin `verifyToken` uses non-timing-safe string comparison on the HMAC signature (`signature !== expected`). Client-auth uses `timingSafeEqual` for the same comparison. The admin path is theoretically vulnerable to timing attacks, but the HMAC payload is just `expires` (predictable), so an attacker can't actually forge a valid signature this way. Cosmetic inconsistency only. Don't report unless someone changes the token payload to include unpredictable data.
- Marketing pages all load `js/main.js` and `css/style.css?v=N`. Tool pages must NOT duplicate hamburger/nav handlers. Cache-busting version is currently `v=16`.
- Service worker (`sw.js`) is "network first" for HTML/static, so cache-version bumps are less catastrophic than typical cache-first SWs.

### False-positive patterns to avoid (to be filled in from decisions.jsonl)
- (none yet - decisions.jsonl is empty)

### Areas explored for the first time
- All of `api/` (lib, public ingest, cron jobs, client portal endpoints sampled, dashboard endpoints sampled).
- `js/quiz.js` and the quiz HTML on `index.html` and `pricing.html`.
- `sw.js` and `vercel.json`.

### Areas NOT yet explored (to investigate in future runs)
- `thomas.html` (~160KB self-contained admin dashboard). Likely has its own quirks - inline JS, fetch-against-self patterns, possible XSS in user-supplied client fields rendered into the table.
- `client-dashboard.html` (~278KB self-contained client PWA). Training, nutrition, 545 modules.
- All 23 blog articles - schema.org JSON-LD, internal links, SEO meta.
- `api/dashboard/client-portal.js` and `api/dashboard/clients.js` (CRUD, file upload paths).
- `api/dashboard/upload-video.js` / `delete-video.js` (Vercel Blob integration).
- `api/client/notify.js`, `api/client/send-email.js` (admin-triggered messaging - any way for client to trigger?).
- Push notification endpoints (`push-subscribe.js`, `push-unsubscribe.js`) - VAPID handling.
