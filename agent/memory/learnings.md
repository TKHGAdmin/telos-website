# Bug Hunter Learnings

Running notes the agent builds up across runs. Patterns worth remembering, false-positive classes to avoid, areas of the codebase explored.

## Known codebase conventions

- `vercel.json` sets `cleanUrls: true` — pages are served without `.html` and internal links drop the extension (CLAUDE.md). Flagging a working `/pricing` link as "missing extension" is a false positive.
- The admin dashboard (`thomas.html`) and client dashboard (`client-dashboard.html`) are intentionally self-contained — they do NOT load `main.js` or `css/style.css`. Flagging that as a bug is a false positive.
- `client-dashboard.html` custom-side-menu panels render coach-authored HTML via `innerHTML` (line ~2749). This is intentional per CLAUDE.md ("Custom items: type 'link' or 'panel' shows HTML content"). Coach-only content, not user XSS.
- Known P1-P3 backlog items already tracked by Thomas (per CLAUDE.md: tool pages missing main.js, `.html` extensions in internal links, `todayStr()` UTC timezone bug in streaks, SW cache version bump). Do NOT re-report these.
- Admin password uses `crypto.timingSafeEqual` with an explicit length short-circuit in `api/lib/auth.js`. That length leak is a conscious tradeoff for a single admin password; not a real finding.

## Areas explored

- 2026-10-24: `api/lib/*`, `api/submit-*`, `api/cron/*`, `api/client/*` (login, me, daily-log, training-log, nutrition-log, activity-log, food-search, notify, send-email, push-subscribe, reset-password), `api/dashboard/*` (login, clients, client-portal), `sw.js`. Not yet opened: `api/dashboard/pipeline.js`, `api/dashboard/content.js`, `api/dashboard/revenue.js`, `api/dashboard/analytics.js`, `api/dashboard/adspend.js`, `api/dashboard/stats.js`, `api/dashboard/submissions.js`, `api/dashboard/emails.js`, `api/dashboard/modules.js`, `api/dashboard/upload-video.js`, `api/dashboard/delete-video.js`, `api/dashboard/chs-applications.js`, `api/client/module*`, `api/client/supplement*`, `api/client/five-four-five.js`, `api/client/sidemenu.js`, `api/client/push-unsubscribe.js`, `api/client/resources.js`, `api/client/mindset.js`, `api/client/nutrition-plan.js`, `api/client/training-program.js`, `api/client/logout.js`, `api/client/supplements.js`. Shared JS (`js/*`) and HTML pages mostly untouched.

## Patterns observed

- Public endpoints (`submit-chs-application`, `submit-quiz`, `submit-email`) all follow the same `INCR` → `EXPIRE on first hit` → compare count pattern for rate limiting. The counter keeps incrementing even after the limit is hit; it still enforces correctly but wastes a Redis op per attempt. P3-worthy only.
- The client login endpoint (`api/client/login.js`) has NO rate limiting. PBKDF2 at 100k iterations slows brute force naturally but a distributed attacker can still try. Worth revisiting under the Security focus rotation.
- `api/client/reset-password.js` has NO rate limiting either — attacker who knows a client email can trigger many reset emails (one per request). Also worth revisiting under Security.
- The admin dashboard renders through many `innerHTML` sinks, but almost all admin-authored data flows through `esc()` first (verified at a glance in thomas.html lines 1114–2536). Client-submitted names/notes rendered in the admin without `esc` would be high-value finds — worth checking under Visual/UX or Security focus days.

## False-positive classes to avoid

- Flagging `innerHTML` without tracing whether the content is user-controlled or admin/coach-authored. Most of the dashboards' sinks are admin/coach-authored.
- Flagging the self-contained dashboards for not loading shared CSS/JS.
- Flagging `/pricing` → `/pricing.html` as missing extensions. Clean URLs are a product decision.
- Flagging `everfitUrl` references as broken — Everfit was intentionally removed per CLAUDE.md but a leftover env var reference lingers in `api/client/me.js`. Tech debt, not functional.
