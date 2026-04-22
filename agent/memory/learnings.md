# Bug Hunter Learnings

Accumulated knowledge. Update on every run. Keep under 2000 lines.

---

## Codebase map (first run)

- **Stack:** Pure HTML/CSS/JS, no framework, no build. Vercel-hosted. Serverless functions under `api/`.
- **Storage:** Upstash Redis via `api/lib/redis.js` REST wrapper.
- **Auth:** Two systems. Admin uses `api/lib/auth.js` (HMAC + shared password). Clients use `api/lib/client-auth.js` (PBKDF2 + client-session cookie with `SameSite=None; Partitioned` for Whop iframe).
- **Client portal:** Single-file `client-dashboard.html` (self-contained, ~5200 lines). Includes FAB/nutrition/training/545/profile all inline.
- **Admin dashboard:** Single-file `thomas.html` (self-contained, ~161k bytes).
- **Marketing pages:** `index.html`, `pricing.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, `chs.html` + 23 blog articles.
- **Cron jobs:** `api/cron/weekly-summary.js` (Mon 2pm UTC), `api/cron/engagement-check.js` (daily 3pm UTC).
- **Key Redis namespaces:**
  - `client:{id}`, `clients_index` (ZSET), `client_email:{normalized}` (email-to-id lookup)
  - Per-client daily logs: `client_dailylog:{id}:{date}`, training, nutrition, 545, supplement, activity (each with `*_index:{id}` ZSET)
  - `course_module:{id}`, `course_modules_index`, `course_series:{name}`, `course_pillars:{name}`
  - `client_module_progress:{id}:{moduleId}`, `client_modules_watching:{id}`, `client_modules_completed:{id}`

## Known backlog (from CLAUDE.md — do NOT re-report)

- Tool pages missing `main.js` load
- `.html` extensions in internal links (multiple pages use `href="index.html#..."`)
- `todayStr()` UTC timezone bug affecting client dashboard streaks
- Service worker `CACHE_NAME = 'telos-v1'` needs bump when cached assets change
- Push notification incomplete — VAPID+RFC 8291 encryption not implemented in `api/client/notify.js`
- Whop iframe login broken on Safari/iOS (third-party cookie blocking)

## False-positive patterns (avoid flagging these)

- Admin auth password length check before `timingSafeEqual` in `auth.js` — minor timing leak on length, not exploitable for single-user admin dashboard.
- HTML email template includes un-escaped `firstName` — admin-controlled input, trust boundary inside the system.
- `modules.js` default `tierAccess` = all tiers when creating new module — explicit opt-in is fine; empty array locking out all users is likely intentional.

## Functional hotspots worth revisiting

- `api/dashboard/clients.js` DELETE handler — does not cascade cleanup of per-client Redis data (emails, logs, plans, progress). See BUG-20260422-01.
- `api/lib/redis.js` — REST wrapper has no timeout or retry; a stalled Upstash call will block the function up to its 60s maxDuration.
- `api/client/*.js` multiple endpoints compute `new Date().toISOString().split('T')[0]` — UTC boundary issues for clients in US timezones at night.

## Patterns I noticed (first pass)

- Cron endpoints correctly fail closed if `CRON_SECRET` is unset (`engagement-check.js:9`, `weekly-summary.js:9`).
- Email enumeration prevention is correct in `reset-password.js` (always 200).
- Rate limits exist on `submit-quiz` (10/hr), `submit-email` (10/hr), `submit-chs-application` (5/hr). All use `ratelimit:*:{ip}` keys with 1hr TTL.
- `cleanUrls: true` in `vercel.json` — but many internal links still include `.html` extension (known backlog item above).

## Tool notes

- `npm audit` is not useful here — only dep is `@vercel/blob`, no lockfile committed.
- `du -sh` for bundle analysis: `client-dashboard.html` ~278 KB, `thomas.html` ~161 KB (inline CSS/JS by design).
- No tests in repo — no `npm test` to run.
