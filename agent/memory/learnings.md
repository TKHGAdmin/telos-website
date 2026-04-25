# Telos Bug Hunter — Learnings

This file is the agent's accumulated knowledge across runs. Entries should be terse and actionable. Compress older entries when this file exceeds 2000 lines.

## Codebase shape (as of 2026-04-25 bootstrap)

- Pure HTML/CSS/JS site, no build step. Hosted on Vercel.
- Public marketing pages: `index.html`, `pricing.html`, `chs.html`, `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`, plus 23 articles in `blog/`.
- Two dashboards (self-contained, no shared CSS/JS): `thomas.html` (admin, password-gated) and `client-dashboard.html` (client PWA).
- API routes under `api/`: lib (auth/redis), `submit-*` public endpoints, `cron/`, `client/` (client-session-gated), `dashboard/` (admin-session-gated).
- Storage: Upstash Redis via REST (no SDK npm dep). Auth cookies HMAC-signed.
- Important conventions documented in `CLAUDE.md` — read it first every run.

## Hunting heuristics that work here

- The `cleanUrls: true` Vercel option means internal links must NOT include `.html`. Grep for `href=".*\.html"` to find leaks.
- Public submit endpoints are intentionally non-blocking on the client (silent fail). Don't flag missing client-side error UI on `submit-quiz` / `submit-email` — that's by design (CLAUDE.md).
- Two cookie names: admin `telos_dash_session`, client `telos_client_session`. Don't conflate them.
- `js/main.js` owns hamburger + nav. Inline scripts on tool pages must NOT duplicate those handlers (CLAUDE.md). If they do, that's a real bug.
- CSS cache busting uses `?v=N` on `style.css`. If you bump it on some pages but not others, those pages serve stale CSS — real P2.
- `body.page-load-anim` exists ONLY on `index.html`. Adding it elsewhere causes blank pages.

## Known false-positive patterns (do NOT report these)

- "Submit endpoints don't show user-facing error" — intentional silent fail for non-blocking lead capture.
- "thomas.html / client-dashboard.html duplicate inline styles" — intentional, they are self-contained PWAs.
- "Old SVG icons (telos-icon-192.svg, telos-icon-512.svg) unused" — CLAUDE.md notes they are deprecated and safe to delete; not a bug.
- "Whop iframe login broken on Safari/iOS" — known limitation documented in CLAUDE.md.

## Open observations to revisit

- CLAUDE.md says CSS version is `?v=16`. If a page is found at a lower version, it's a stale-CSS bug.
- CLAUDE.md notes a P1-P3 backlog from the April 2026 bug crawl (commit 7fa38ff). Items mentioned:
  - tool pages missing main.js — confirmed unresolved 2026-04-25 (reported as 2026-04-25-01)
  - .html extensions in internal links — confirmed unresolved 2026-04-25 (reported as 2026-04-25-04, 28 pages)
  - todayStr() UTC timezone bug in client dashboard streaks — confirmed unresolved 2026-04-25 (reported as 2026-04-25-02)
  - SW cache version bump needed — `sw.js:4` still `telos-v1`; network-first strategy hides most staleness, deferred to a Performance focus day
- `api/lib/auth.js:27` admin signature comparison uses `!==` (not timing-safe) while `api/lib/client-auth.js:49` uses `crypto.timingSafeEqual`. Save for next Security day.
- `api/cron/engagement-check.js` had no last-sent tracking as of 2026-04-25 (reported as 2026-04-25-03). If this gets fixed, watch for a similar issue in `weekly-summary.js`.

## Search recipes that paid off

- `grep -nE 'href="[^"]*\.html' <files>` — finds clean-URL leakage fast.
- `grep -c 'main.js' <pages>` — quick check for missing shared JS on public pages.
- `grep -nE 'todayStr|toISOString|getDate' client-dashboard.html` — surfaces date-handling and reveals the UTC slice anti-pattern.
- `grep -nE 'last.*reminder|reminder.*sent' api/` — fastest way to confirm a cron has no cooldown logic.
- `grep -rlE 'href="[^"]*\.html' blog/ | wc -l` — counts blog pages still using extension-style links (compare to `ls blog/*.html | wc -l`).

## Notes on the run setup

- This is a static-HTML site with no test runner, no linter, no `tsc`. Functional hunting is purely static-analysis + grep + careful read of API handlers. There's no `npm test` to run.
- `package.json` only declares `@vercel/blob`; no scripts.
- Reports must currently use the schema embedded in `2026-04-25.md` until `docs/BUG_REPORT_SCHEMA.md` is added.

## Schema note

The agent system prompt references `docs/BUG_REPORT_SCHEMA.md`, but that file does not exist in this repo. Reports use the schema embedded in the report file itself: front-matter with `date`, `focus`, `bug_count`, then one section per bug with id (`YYYY-MM-DD-NN`), title, severity, location, repro, why-it-matters, suggested-fix. This is the contract until the schema doc is added.
