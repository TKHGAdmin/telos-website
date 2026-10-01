# Telos Bug Hunter - Learnings

Running log of codebase patterns, false-positive traps, and context accumulated across runs. Keep under 2000 lines; compress older entries into a summary at the top when the file grows.

---

## Repo map at a glance

- Pure static HTML/CSS/JS, no build step. Vercel-hosted. `cleanUrls: true`, so internal links OMIT `.html`.
- `thomas.html` is a self-contained admin SPA (~5k lines inline) that calls `/api/dashboard/*` endpoints.
- `client-dashboard.html` is a self-contained client PWA (~6k lines inline) that calls `/api/client/*` endpoints.
- Public pages (`index.html`, `pricing.html`, `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, `shop.html`, `product.html`, blog/*) all load shared `css/style.css?v=16` and `js/main.js`.
- API runs on Vercel serverless functions with Upstash Redis (via `api/lib/redis.js`) as the only data store.
- Public form submissions (`submit-quiz`, `submit-email`, `submit-chs-application`) require no auth; everything else requires a session cookie.

## Known-OK patterns (do not flag as bugs)

- `verifyPassword` in `api/lib/auth.js` does `if (inputStr.length !== expected.length) return false;` before `crypto.timingSafeEqual`. This is intentional - `timingSafeEqual` throws on length mismatch, and admin passwords have no secrecy around their length.
- `SHOPIFY_STOREFRONT_TOKEN` hardcoded in `js/shop.js`. Storefront API tokens are designed for client-side exposure. The Admin API token would be different.
- `CACHE_NAME = 'telos-v1'` in `sw.js` is stale vs. `css/style.css?v=16` and client-dashboard revisions - already in CLAUDE.md backlog, don't re-report.
- `.html` extensions in some internal links (e.g. `product.html:797`, several blog pages) - already in CLAUDE.md backlog, don't re-report unless a NEW link is added with `.html`.
- Admin dashboard loads four Google Font families with many weight variants - defensible given CLAUDE.md's typography requirements. Don't flag unless a page adds a FIFTH family.
- Public submit endpoints set `Access-Control-Allow-Origin: *`. This is intentional per `vercel.json`.
- `esc()` in `thomas.html:731` uses `createTextNode` + `innerHTML`, which escapes `<`, `>`, `&` but NOT `"` or `'`. That's fine because `esc()` is always used in element text content or single-quoted HTML attributes. **BUT** - if you ever see `esc(x)` used inside a DOUBLE-quoted HTML attribute whose value could contain `"`, that IS a bug worth flagging.

## Red-flag patterns (worth hunting)

- **Field-name convention drift**: writer uses camelCase (`totalScore`, `submittedAt`) while reader uses snake_case (`s.score`, `s.created_at`). Found in `thomas.html` Leads/Overview tabs vs. `submit-quiz.js` and `stats.js`. Hunt this systematically.
- **innerHTML with user data NOT run through `esc()`**: 119 innerHTML sites across `thomas.html`, `client-dashboard.html`, `protein-calculator.html`, `hyrox-predictor.html`. Prioritize sinks where the data path flows from a PUBLIC endpoint (quiz, email capture, chs application) to an admin-rendered row.
- **Public endpoints with no input length/charset validation**: `submit-quiz.js`, `submit-email.js`, `submit-chs-application.js` all let any string through. Combined with innerHTML sinks this is a stored XSS surface.
- **Attribute injection via JSON.stringify in HTML strings**: `JSON.stringify` escapes for JS, NOT for HTML attribute context. `JSON.stringify(JSON.stringify(x))` embedded in `onclick="..."` is a classic trap - see Bug 1 of 2026-10-01.
- **Below-the-fold images with no `loading="lazy"`**: only `client-dashboard.html` and `chs.html` use it. Every image on `index.html` is eager.
- **`.html` references in NEW links**: `cleanUrls` handles it with a redirect, but it adds a hop. Only report NEW occurrences in files that have been recently touched.

## File-name map for the data layer

- Quiz submission ZSET: `quiz_submissions` (members = JSON of {name, email, phone, scores, totalScore, page, submittedAt, ip}).
- Email captures: `email_protein_calculator`, `email_hyrox_predictor` (ZSETs; members = JSON of {email, source, submittedAt, ip}).
- Charleston applications: `chs_application:{id}` + `chs_applications_index` ZSET; status in {new, contacted, consultation, closed_won, closed_lost}.
- Client records: `client:{id}` + `client_email:{normalizedEmail}` lookup. Client sub-data uses `client_<thing>:{clientId}` or `client_<thing>:{clientId}:{YYYY-MM-DD}` patterns documented in CLAUDE.md.
- Rate limits: `ratelimit:{bucket}:{ip}` INCR+EXPIRE pattern. The EXPIRE only sets on count === 1; if a pod crashes between INCR and EXPIRE the key is immortal. Low priority to report but worth remembering.

## Unexplored (for future runs)

- `api/dashboard/analytics.js` (219 lines, Vercel analytics proxy) - not yet scanned.
- `api/dashboard/modules.js` + `api/client/modules.js` + `api/client/module-progress.js` - learning modules system.
- `api/cron/weekly-summary.js` + `api/cron/engagement-check.js` - email cron jobs.
- All 23 blog pages - likely identical structure, scan 1-2 as representative sample.
- `js/quiz.js` (16k) - quiz client logic, could have validation bypasses.
- `client-dashboard.html` training timer and completion logic.
- CSP / security headers (`vercel.json` sets none).

## Rotation history

- 2026-10-01: first run, multi-focus (no prior state). Reported 1 P0, 1 P1, 2 P2. Next focus: Visual/UX.
