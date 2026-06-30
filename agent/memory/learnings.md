# Telos Bug Hunter - Accumulated Learnings

Updated as the agent learns from approvals, denials, and recurring patterns.
Keep under 2000 lines.

---

## 2026-06-30 - Bootstrap Run

First run. No prior decision history to learn from.

### Codebase orientation notes

- All API handlers are CommonJS Node.js modules in `api/`. Auth split:
  - Admin (dashboard): `api/lib/auth.js` - HMAC token, 2 parts, `telos_dash_session` cookie, SameSite=Strict.
  - Client (portal): `api/lib/client-auth.js` - HMAC token with clientId.expiry.signature, 3 parts, `telos_client_session` cookie, SameSite=None Partitioned for Whop embed.
- Redis access via Upstash REST (`api/lib/redis.js`). No transactions - multi-step writes are not atomic.
- Two cron jobs: `weekly-summary` (Mon 14:00 UTC) and `engagement-check` (daily 15:00 UTC). Both require CRON_SECRET, both gracefully skip if RESEND_API_KEY missing.
- Public form submission endpoints (`submit-quiz`, `submit-email`, `submit-chs-application`) all rate-limit per IP via Redis INCR.
- Login endpoints have NO rate limit. Brute force-able. (Save for Security focus day.)
- All date keys for daily logs use `new Date().toISOString().split('T')[0]` - UTC. Known timezone bug for evening EST users (already in P1-P3 backlog per CLAUDE.md).

### Known issues already in the backlog (do NOT report)

Per CLAUDE.md: "Tool pages missing main.js, .html extensions in internal links, todayStr() UTC timezone bug in client dashboard streaks, SW cache version bump needed."

So skip:
- Client-dashboard streak using UTC date.
- 30 pages using `href="*.html"` instead of clean URLs (38 root + 184 blog occurrences).
- Tool pages (protein-calc, hyrox) inlining nav handlers vs loading main.js.
- Service worker `telos-v1` cache version not bumped recently.

### Patterns to remember

- `parseFloat(x) || null` collapses "0" to null. Common in daily-log validation - usually fine, but if zero is a valid input (rare for weight/water), this loses it.
- Inline `onclick="fn('${value}')"` in JS-generated HTML strings is everywhere in shop.js, client-dashboard.html, thomas.html. Generally safe because the interpolated values come from trusted backend data, but watch for unescaped quotes/HTML.
- Email HTML in cron jobs interpolates `client.name` raw. Client name is coach-controlled, so XSS risk is low - but malformed names could break rendering.
- Cron jobs use raw `fetch('https://api.resend.com/emails', ...)` without retry. Resend transient failures silently drop emails for that client - logged but not surfaced.

### False-positive patterns to avoid

(None yet - no denial history.)
