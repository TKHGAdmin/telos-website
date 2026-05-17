# Bug Hunter Learnings

This file accumulates patterns the agent has noticed across runs. Older entries get compressed when this file exceeds 2000 lines.

## Codebase orientation (run 1)

- Tech: pure HTML/CSS/JS, no build step, hosted on Vercel with serverless functions under `api/`. Redis (Upstash) is the only persistent store.
- Two dashboards exist and are intentionally self-contained: `thomas.html` (admin) and `client-dashboard.html` (client PWA). They do NOT load `js/main.js` or `css/style.css`. Do not report "missing main.js" against these two pages.
- Public marketing pages and blog posts DO load `js/main.js` and `css/style.css?v=16`. A blog page or tool page missing `main.js` would be a real bug.
- `body.page-load-anim` is intentionally only on `index.html`. Do not report it as missing elsewhere.
- The `CLAUDE.md` "Known Limitations" section explicitly enumerates a P1-P3 backlog already known to the maintainer (April 2026 bug crawl, commit 7fa38ff). Do not re-report any of:
  - tool pages missing main.js
  - .html extensions in internal links
  - `todayStr()` UTC timezone bug in client dashboard streaks
  - Service worker cache version bump (`telos-v1` -> next)
  - Whop iframe / Safari third-party cookie issue
- Clean URLs are enforced via `vercel.json` `cleanUrls: true`. Internal links *should* omit `.html`. A page using `.html` in an `href` is a backlog item, not a new finding.

## False-positive patterns to avoid

- Style/preference disagreements (naming, file organization, "could refactor").
- "Missing tests" — there is no test suite in this repo. Do not flag absence of tests.
- "Inline styles should be extracted" — for `thomas.html` and `client-dashboard.html` this is the explicit convention.
- "Missing TypeScript / type safety" — this is a vanilla JS project by design.
- Hard-coded strings that are clearly intentional (Calendly URLs, Whop URLs, brand colors).

## Conventions to respect when grading severity

- P0 requires either: leaked secret, broken auth, broken payment, or a crash on a core flow.
- A purely cosmetic issue is never above P2.
- A bug that only fires for the admin (single user: Thomas) is one severity level lower than the same bug on a client-facing page.

## Run 1 notes (2026-05-17, functional)

- Mapped the API surface. All endpoints called from `client-dashboard.html` (via the `api()` helper at line 1890) and `thomas.html` exist under `api/client/` and `api/dashboard/`. No missing endpoints found.
- Single-sender deliverability surface: every transactional email (password reset, weekly summary, engagement reminder, future emails) flows through one Resend sender `noreply@telosathleticclub.com`. A misbehaving cron can degrade the deliverability of all of them. Worth weighing this when grading email-related bugs.
- Findings I considered but did not report this run (P3 or below; saving until I have stronger signal on what Thomas wants):
  - `daily-log.js:75-76` uses `parseFloat(body.water) || null` and `parseInt(body.steps, 10) || null`, which silently converts a legitimate 0 into null. Low impact because the UI likely renders both as 0.
  - `clients.js` POST (lines 70-73) checks `client_email:{email}` for duplicate emails, but that lookup record is only populated by `client-portal.js:117` when the portal is *enabled*. Two clients can share an email as long as neither has portal access yet. Narrow edge case.
  - `quiz.js` adds a new `submit` and `retake` click listener on every render of the lead-capture step (`setupLeadCapture`, line 222 onward). Retaking the quiz N times results in N duplicate API submissions on the next finish. Minor.
  - `api/lib/auth.js:27` compares HMAC signatures with `!==` rather than `crypto.timingSafeEqual`, contradicting the CLAUDE.md claim of "timing-safe comparison" on dashboard cookies. Saving this for the next Security-focus run instead of mixing it in here.
  - `api/client/notify.js` always returns `ok: true` even when the push delivery fails or VAPID isn't configured. Self-acknowledged "placeholder" in code comments, not a hidden bug.
- New code-area knowledge: `engagement-check.js` and `weekly-summary.js` both walk a `clients_index` ZSET and pipeline a per-day GET per client. Any bug in the engagement cadence (timing, dedup, content) reproduces in both crons.
