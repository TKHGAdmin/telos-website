# Telos Bug Hunter - Learnings

Append-only log of patterns, false-positive triggers, and codebase notes accumulated across runs. Keep under 2000 lines; compress older entries when needed.

---

## 2026-04-30 (run 1, focus: Functional)

### Codebase orientation
- First run. Bootstrapped `agent/memory/`, `agent/reports/`, and `docs/BUG_REPORT_SCHEMA.md`.
- Telos is pure HTML/CSS/JS, no build step. API is Vercel Serverless Functions reading/writing Upstash Redis via REST. There is no test suite, no CI config visible, no `npm test`. Static analysis via `tsc --noEmit` is not applicable (no TS).
- Practical hunt surface: read API handlers, grep nav/link consistency across pages, scan inline `<script>` blocks in self-contained pages (`thomas.html`, `client-dashboard.html`, `chs.html`, `pricing.html`, tool pages).
- `CLAUDE.md` contains a rich snapshot of intent, conventions, Redis key shapes, and a P1-P3 backlog of known issues. Cross-reference findings against CLAUDE.md before reporting to avoid duplicating known items.

### Known-issue exclusions (per CLAUDE.md, do NOT re-report)
- Tool pages missing `js/main.js`.
- `.html` extensions present in some internal links (cleanUrls is on).
- `todayStr()` / `client-dashboard` UTC timezone bug for streaks (`new Date().toISOString().split('T')[0]`).
- Service worker `CACHE_NAME = 'telos-v1'` not bumped.
- Whop iframe / Safari iOS third-party cookie limitation for client portal login.

### Patterns to watch
- **Redis lookup orphans on delete.** The codebase consistently creates secondary lookup keys (`client_email:{norm}`, `clients_index`, per-client ZSET indices) but does not always delete them in DELETE handlers. Anywhere a SET/ZADD creates a lookup, check the delete path. Confirmed bug today in `api/dashboard/clients.js` DELETE — orphan `client_email:` blocks re-adding the same email.
- **Site-wide nav/footer inconsistency.** When auditing public pages, grep for canonical brand fields (instagram handle, calendly URLs, email address) across all `.html` files. Today's homepage IG icon mismatch only surfaced from cross-page diff. Worth running this kind of grep on every Functional and Visual/UX day.
- **Self-contained pages duplicate logic.** `thomas.html`, `client-dashboard.html`, `chs.html`, `pricing.html`, and the two tool pages each carry their own inline `<script>` and styles. Bugs in one are not necessarily fixed in the others. Treat each as its own surface.
- **CORS `Access-Control-Allow-Origin: *` on submit endpoints.** Both `submit-quiz.js` and `submit-email.js` echo wildcard CORS. Functional behavior is fine; flag for Security-day review (CSRF surface on public POST endpoints — but they're public and rate-limited, so probably acceptable).

### False-positive patterns (avoid reporting)
- **`Math.max(1, Math.min(5, parseInt(x, 10) || 0))` in `daily-log.js`** — looks suspect because `parseInt(0)||0 = 0` and then `Math.max(1, 0) = 1` always promotes 0 to 1, but min input from the UI is 1, so it's effectively a clamp. Not a bug.
- **`countInterval = countDuration / totalScore` in `quiz.js`** — looks like a division-by-zero risk, but the quiz minimum total score is 8 (each question minimum is 1 point, 8 questions). Unreachable. Not a bug.
- **`engagement-check.js` daily reminder loop** — once a client is 3+ days inactive they get a reminder every cron run. Looks spammy, but it's a product decision (active client engagement strategy), not a defect. Do not flag without a stronger signal that it's unintended.
- **Web Push `notify.js` "simplified implementation"** — endpoint POSTs directly to subscription endpoint without VAPID JWT or RFC 8291 payload encryption. The author already commented "for production, consider adding web-push npm package" and the function returns success even on push-service rejection. Real shortcoming, but already self-documented as incomplete and gated behind admin-only triggering. Save for a Security-focus or Performance-focus day where it pairs naturally; do not waste a Functional slot on it.
- **`auth.js` admin password length leak** — `if (inputStr.length !== expected.length) return false;` short-circuits before `timingSafeEqual`. This is a side-channel, not functional. Save for Security focus.

### Files read this run
- `CLAUDE.md`
- `api/lib/auth.js`, `api/lib/client-auth.js`, `api/lib/redis.js`
- `api/submit-quiz.js`, `api/submit-email.js`, `api/submit-chs-application.js`
- `api/client/login.js`, `api/client/reset-password.js`, `api/client/daily-log.js`, `api/client/training-log.js`, `api/client/nutrition-log.js`, `api/client/food-search.js`, `api/client/notify.js`, `api/client/activity-log.js`, `api/client/module-progress.js`
- `api/cron/engagement-check.js`, `api/cron/weekly-summary.js`
- `api/dashboard/login.js`, `api/dashboard/clients.js`, `api/dashboard/client-portal.js`, `api/dashboard/analytics.js`
- `vercel.json`, `manifest.json`, `sw.js`, `js/main.js`, `js/quiz.js` (partial)
- Cross-page grep over `*.html` and `blog/*.html` for `instagram` and `nav-ig-story`.

### Open threads for next runs
- Visual/UX day: audit nav consistency on `chs.html` (uses overrides for hotel aesthetic) — confirm hamburger / Client Login / Calendly links still resolve. Audit mobile breakpoints on `pricing.html` quiz overlay.
- Performance day: client-dashboard.html is 278KB inline. Worth measuring main-thread cost. Also inspect blog images for unoptimized assets.
- Security day: revisit `auth.js` password-length leak, `notify.js` placeholder push, CORS on `submit-*` endpoints, `dangerouslySetInnerHTML`-equivalents (innerHTML assignments) in admin and client dashboards. Run `git log -p | grep -i 'sk-\|api[_-]key\|secret'` for accidental commits.
- Search for additional Redis-orphan patterns in DELETE handlers across `api/dashboard/*.js` (pipeline, content, adspend, modules). The `clients.js` orphan suggests this pattern was not enforced consistently.
