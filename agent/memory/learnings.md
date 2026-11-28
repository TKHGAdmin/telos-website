# Telos Bug Hunter - Accumulated Learnings

This file is the agent's memory across runs. Append after each run with:
- Patterns worth watching next time
- False-positive patterns to stop reporting
- New areas of the codebase explored for the first time

Cap at 2000 lines; compress older entries into a summary when exceeded.

---

## 2026-11-28 - Bootstrap run

Agent infrastructure (`agent/memory/`, `agent/reports/`, `docs/BUG_REPORT_SCHEMA.md`) was not present in the repo on first scheduled run. Created it. Focus-rotation seeded with Day 0 (Functional).

Baseline knowledge from CLAUDE.md:
- Pure static HTML/CSS/JS, hosted on Vercel; serverless functions in `api/`
- Upstash Redis for all persistence
- Two auth systems: admin (`telos_dash_session`, 2-part token) and client (`telos_client_session`, 3-part token with embedded clientId)
- Admin cookie is `SameSite=Strict`; client cookie is `SameSite=None; Partitioned` for Whop iframe
- CSS version is `?v=16` across pages; bump when `css/style.css` changes
- Service worker cache name is `telos-v1`; bump when assets change
- CLAUDE.md "Project Structure" is stale: `coaches.html`, `product.html`, `shop.html`, `set-password.html`, `js/shop.js` exist but are not listed

Areas to probe in future runs:
- authZ on every `api/dashboard/*` and `api/client/*` endpoint (verifySession guard)
- Redis key symmetry (write path vs read path, index cleanup on delete)
- Cron endpoints must check `CRON_SECRET` and fail-closed
- Public endpoints must rate-limit and validate shape

False-positive patterns to avoid:
- Do not flag "missing CSRF token" on endpoints where SameSite cookie + no state-changing GET is sufficient defense (document intent)
- Do not flag inline-styles-vs-stylesheet in dashboards; they are intentionally self-contained per CLAUDE.md
- CLAUDE.md section being stale is a doc gap, not a code bug

### Verified patterns from today's hunt

- **Trace the caller before escalating a primitive bug.** `verifyPassword('', '')` returns `true`, but the only caller (`api/dashboard/login.js:10`) short-circuits on falsy `password`. Initial fork triage called this P0; verification downgraded to P2. Future runs: when a security primitive has a hole, grep every caller before severity assignment.
- **Redis key symmetry is a rich vein for data-integrity bugs.** CRUD handlers often write to multiple keys (primary, lookup index, per-item ZSET) but delete only the primary. `clients.js` DELETE was the example today. Worth a systematic sweep of every write-path/delete-path pair in a future Functional day.
- **`cleanUrls: true` in vercel.json means every `.html` link is a 308.** Internal nav should always be clean. Blog pages use `../index.html` 184 times; root pages do it right.

---
