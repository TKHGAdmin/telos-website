# Telos Bug Hunter - Accumulated Learnings

Started: 2026-09-27

## About this file
Short, durable notes that make each next run smarter. Patterns worth remembering, false-positive traps to avoid, and areas of the codebase already explored.

Keep entries scannable. Compress when the file exceeds ~2000 lines.

## Known limitations already documented in CLAUDE.md (do NOT report)
These are on Thomas's existing P1-P3 backlog and would be duplicates:

- Whop iframe cookies do not work on Safari/iOS - client-portal login is broken in the Whop iOS app / Safari because Safari blocks third-party cookies. Documented workaround: direct URL or PWA homescreen. Do not re-report as a new bug.
- Tool pages missing `js/main.js` include (per CLAUDE.md's P1-P3 backlog notes). Do not re-report.
- `.html` extensions used in some internal links despite `cleanUrls: true`. Already tracked.
- `todayStr()` UTC timezone bug in client-dashboard streak calculation. Already tracked.
- Service worker cache version (`CACHE_NAME = 'telos-v1'`) never bumped when cached assets change. Already tracked.

## Codebase conventions worth remembering
- Pure HTML/CSS/JS, no build step, no framework, hosted on Vercel.
- All internal links use clean URLs (no `.html`) via `vercel.json` `cleanUrls: true`.
- `index.html` is the only page that opts into `body.page-load-anim`. Other pages should NOT have it.
- `thomas.html` and `client-dashboard.html` are self-contained (own inline CSS/JS) and do NOT load `main.js` or `style.css`. Do not report "missing main.js" for these.
- CSS uses cache-busting `?v=N` query on all pages. Currently `v=16`.
- Blog articles (23 files in `/blog/`) are standalone HTML with inline `<style>` and no images.
- Client dashboard rules: gold `#C9A84C` is brand-only, red-to-green for data. No emojis in data displays.

## Areas explored so far
- 2026-09-27 (performance run): image assets (`images/`), homepage/CHS `<img>` markup, `css/style.css`, `sw.js`, `api/dashboard/clients.js`, `api/cron/weekly-summary.js`, page-level `<link>`/`<script>` inventory.

## Patterns / false-positive traps observed
- `.about-photo` appears twice in `css/style.css` (lines 2284 and 3443). Second block is an intentional layered override that adds `transform` transition on hover; not a bug on its own. Reported as P3 tech debt for clarity, expect denial if Thomas prefers cascading layered rules.
- Google Fonts request loads many weights (Bebas Neue + DM Sans 300/400/500/700 + Outfit 300-900 + Space Mono 400/700). Grepping `font-weight:` across CSS + HTML confirms every weight 300-900 is actually used somewhere. Do NOT flag as bloat.
- Weekly-summary cron sends emails sequentially (line-by-line `await fetch` in a `for` loop). Looks N+1-ish but is almost certainly intentional Resend rate-limit compliance. Skip unless client roster grows large enough that cron timeout becomes an issue.
- Dashboard endpoints (clients.js, weekly-summary.js) already use `redisPipeline` batching. No N+1 in Redis reads.

## Approval/denial patterns
(Empty - decisions.jsonl has no entries yet. Start conservative, build trust.)
