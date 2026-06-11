# Telos Bug Hunter — Learnings

Accumulated knowledge across runs. Newest entries at the bottom.

---

## 2026-06-11 (first run — Functional focus)

### Bootstrap notes
- The agent directory (`agent/memory/`, `agent/reports/`) and `docs/BUG_REPORT_SCHEMA.md` did not exist when this run started. Memory files and the focus-rotation file were created on this run.
- No `docs/BUG_REPORT_SCHEMA.md` exists. The report at `agent/reports/2026-06-11.md` uses a self-consistent schema (see top of that file). Future runs should mirror that structure until a real schema is checked in by Thomas.
- `decisions.jsonl` is empty. No prior approvals or denials to calibrate against. Reported only high-confidence findings — biased toward precision over recall.

### Codebase map (what I learned about the structure)
- Pure HTML/CSS/JS site + Vercel serverless functions in `api/`. No build step.
- Two auth surfaces:
  - **Admin** (`api/lib/auth.js`) — HMAC-signed cookie `telos_dash_session`, format `{expires}.{signature}`. Uses `crypto.timingSafeEqual` for password only.
  - **Client** (`api/lib/client-auth.js`) — HMAC-signed cookie `telos_client_session`, format `{clientId}.{expires}.{signature}`. Uses `crypto.timingSafeEqual` for both password and HMAC signature.
- Storage is Upstash Redis via REST. Pipeline helper at `api/lib/redis.js`. Common pattern: `client:{id}` (record) + `client_email:{normalizedEmail}` (id lookup) + `clients_index` (ZSET).
- Two cron jobs (require `CRON_SECRET`): `weekly-summary` (Mon 14:00 UTC), `engagement-check` (daily 15:00 UTC).
- Quiz scoring: 8 questions, each 1-5 pts. Pillar groups (Training/Nutrition/Recovery/Accountability), pillar score 2-10, total 8-40.

### Patterns to keep watching
- Inline `onclick="..."` handlers that interpolate Shopify variant IDs and line item IDs into HTML. Today these IDs are safe-looking GIDs, but if Shopify formats change or admin titles include quotes, breakage is possible.
- HTML emails built by string concatenation with un-escaped client name (`reset-password.js`, `weekly-summary.js`, `engagement-check.js`). The to: address is the client themselves so XSS is self-inflicted, but layout breakage from a quote or angle bracket in a name is plausible.
- Cron jobs have minimal idempotency — they iterate clients and send mail per loop with no per-client "already sent today" check. Easy place for spam regressions.
- Many `if (body.x !== undefined)` blocks use `parseInt(x, 10) || 0` then clamp via Math.max/min. The `|| 0` swallows NaN silently rather than rejecting invalid input.

### False-positive patterns to avoid
- Don't report missing CORS headers on error paths in `api/submit-*.js` — `vercel.json` sets them globally for `/api/submit-(.*)`.
- Don't report inline `style=""` strings in `quiz.js`/`reset-password.js` etc. as bugs unless they break behavior; the project does not gate inline styles.
- Don't report "could use TypeScript" or general modernization — the project is intentionally pure HTML/CSS/JS, no build step.
- Don't report HTML escaping in admin-dashboard self-served HTML strings unless an external-input vector exists.

### Areas not yet explored (open for future runs)
- `client-dashboard.html` (278 KB, inline JS/CSS) — major surface for Visual/UX day.
- `thomas.html` (161 KB) — admin dashboard, big surface for both Functional and Security days.
- 23 blog HTML files — likely target for Visual/UX (responsive + alt text) and Performance.
- `sw.js` service worker — caching and push notification correctness.
- Vercel Web Analytics proxy in `api/dashboard/analytics.js`.
