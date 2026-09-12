# Bug Hunter — Learnings

Accumulated knowledge across daily runs. Compress older entries when this file exceeds 2000 lines.

## Codebase shape (as of 2026-09-12)

- Pure HTML/CSS/JS, no build step, Vercel serverless functions in `/api/`
- Data in Upstash Redis (via `api/lib/redis.js`)
- Admin dashboard `/thomas` and client dashboard `/client-dashboard` are self-contained (no shared CSS/JS)
- All public pages should load `js/main.js` (nav, hamburger, animations)
- CSS cache buster currently `?v=16` — must bump on every `style.css` change

## Known intentional patterns (do NOT flag as bugs)

- Quiz/email submissions are fire-and-forget (silent fail on network error) — by design
- Admin cookie `SameSite=Strict`, client cookie `SameSite=None; Partitioned` (Whop iframe support) — intentional
- Client dashboard uses `Partitioned` cookie; Safari third-party cookies still blocked in Whop iframe — documented limitation, not a bug
- Old SVG icons (`telos-icon-*.svg`) still in repo but unreferenced — documented as safe to delete, not a bug
- Bug crawl P1-P3 backlog exists (commit 7fa38ff) — do not re-report items already tracked there

## False-positive patterns to avoid

- (populate from denials in `decisions.jsonl` as feedback accumulates)

## Focus rotation notes

- Day 0 Functional: form submissions, API contract mismatches, dead links, cron config
- Day 1 Visual/UX: mobile breakpoints, a11y, contrast, alt text
- Day 2 Performance: bundle size, image weight, N+1 patterns, render-blocking
- Day 3 Security: exposed secrets, missing auth, XSS, insecure DORs, dependency CVEs

## Areas explored (first-time visits)

- 2026-09-12: Initial run — bootstrapped scaffolding, first pass on functional layer
