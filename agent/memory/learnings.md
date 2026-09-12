# Bug Hunter - Learnings

Accumulated knowledge across daily runs. Compress older entries when this file exceeds 2000 lines.

## Codebase shape (as of 2026-09-12)

- Pure HTML/CSS/JS, no build step, Vercel serverless functions in `/api/`
- Data in Upstash Redis (via `api/lib/redis.js`)
- Admin dashboard `/thomas` and client dashboard `/client-dashboard` are self-contained (no shared CSS/JS)
- All public pages should load `js/main.js` (nav, hamburger, animations)
- CSS cache buster currently `?v=16` - must bump on every `style.css` change
- Repo convention: NO em dashes. Use hyphens everywhere.

## Known intentional patterns (do NOT flag as bugs)

- Quiz/email submissions are fire-and-forget (silent fail on network error) - by design
- Admin cookie `SameSite=Strict`, client cookie `SameSite=None; Partitioned` (Whop iframe support) - intentional
- Client dashboard uses `Partitioned` cookie; Safari third-party cookies still blocked in Whop iframe - documented limitation, not a bug
- Old SVG icons (`telos-icon-*.svg`) still in repo but unreferenced - documented as safe to delete, not a bug
- Bug crawl P1-P3 backlog exists (commit 7fa38ff) - do not re-report items already tracked there
- `todayStr()` UTC timezone bug in client dashboard streaks is on the P1-P3 backlog - do not re-flag
- `href="foo.html"` internal links violate the clean-URLs convention but function fine via Vercel `cleanUrls` redirect - style, not functional

## False-positive patterns to avoid

- (populate from denials in `decisions.jsonl` as feedback accumulates)

## Focus rotation notes

- Day 0 Functional: form submissions, API contract mismatches, dead links, cron config
- Day 1 Visual/UX: mobile breakpoints, a11y, contrast, alt text
- Day 2 Performance: bundle size, image weight, N+1 patterns, render-blocking
- Day 3 Security: exposed secrets, missing auth, XSS, insecure DORs, dependency CVEs

## Areas explored (first-time visits)

- 2026-09-12: Initial run - bootstrapped scaffolding, first pass on functional layer
  - Traced: quiz.js -> /api/submit-quiz; chs.html -> submit-chs-application; email tools -> submit-email; client login; both crons; admin client CRUD
  - Filed: 3 findings (P1 quiz bypass, P2 client delete email leak, P2 engagement cron spam)
  - Dropped as first-run noise risk:
    - `api/client/notify.js` Web Push placeholder (self-documented in code comments; handler returns explicit "queued/uncertain" states)
    - `api/dashboard/clients.js` POST not reserving `client_email:` (race only manifests on duplicate-email create + double portal-enable)

## Observed patterns worth remembering

- The public quiz + email endpoints are fire-and-forget with `.catch(function(){})` - do NOT flag missing error UI as a bug; DO flag when the silent catch masks a validation failure the user should see (Finding 1 today).
- `client_email:{normalizedEmail}` is a lookup key with multiple writers (client-portal.js on portal-enable, clients.js on PUT email-change) and only one deleter (client-portal.js on portal-disable). Any client lifecycle change that touches email must be checked against all three writers plus the DELETE path.
- All cron handlers correctly check `CRON_SECRET` and fail closed when Resend keys are absent. Good pattern.
