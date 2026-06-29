# Telos Bug Hunter - Learnings

Living notes on patterns, false positives, and areas explored. Compress older entries when this exceeds 2000 lines.

## 2026-06-29 - First run (Functional focus)

### Codebase map (top of mind)
- Pure HTML/CSS/JS, no build step. API is Vercel serverless functions in `api/`.
- Auth split: admin (HMAC token, 2 parts) and client (HMAC token, 3 parts, PBKDF2 hashes).
- Storage: Upstash Redis via REST. All client per-day data keyed `client_*:{clientId}:{YYYY-MM-DD}` with a parallel ZSET index.
- Two crons: `weekly-summary` (Mon 14:00 UTC) and `engagement-check` (daily 15:00 UTC). Both require CRON_SECRET, both depend on RESEND_API_KEY.
- Public submit endpoints (quiz, email, chs) are rate-limited per IP per hour. Auth-protected endpoints are not rate-limited.

### Patterns to watch
- Admin DELETE handlers tend to drop only the primary record + index entry; reverse lookups (`client_email:*`) and per-client log data are not swept. Look for this pattern in any new admin CRUD.
- Cron jobs that send email have no "last-sent" throttling. Adding a new daily cron without thinking about email frequency is a recurring risk.
- `parseFloat(x) || null` clobbers legitimate `0` values; same for `parseInt(x, 10) || null`. Watch for this in log endpoints with optional numeric fields.
- Cookie auth split (admin SameSite=Strict, client SameSite=None;Partitioned) means Whop iframe is intentional but Safari/iOS will still break it (known limitation).
- CLAUDE.md already tracks: `.html` extensions in internal links across all pages, `todayStr()` UTC timezone bug in client-dashboard streaks, SW `telos-v1` cache name not bumped. Do NOT re-report these.

### False-positive patterns to avoid
- Hardcoded Vercel `PROJECT_ID` in `api/dashboard/analytics.js` is a project identifier, not a secret. Not a bug.
- `verifyPassword` short-circuits on length mismatch (timing-leak) - this is a known minor admin-side issue, not exploitable without the password length being a meaningful constraint. Don't re-report unless context changes.
- HMAC signature comparison uses `===` in `api/lib/auth.js` line 27. Timing attacks on HMAC outputs of unknown-key payloads are not practical. Already mitigated in client-auth.js (which uses `timingSafeEqual`). Don't report admin variant as a high-priority issue.

### First-time exploration
- `api/cron/*` - both cron handlers read end-to-end.
- `api/submit-*.js` - all three public submit endpoints.
- `api/dashboard/{login,clients,chs-applications,analytics}.js`.
- `api/client/{login,daily-log,food-search,reset-password}.js`.
- `api/lib/{auth,client-auth}.js`.
- `js/quiz.js` scoring + lead capture.
- `sw.js`, `vercel.json`, `chs.html` form submission JS.
