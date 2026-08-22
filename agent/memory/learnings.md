# Telos Bug Hunter - Accumulated Learnings

## Bootstrap notes (2026-08-22)

This is the first run. Neither `agent/` nor `docs/BUG_REPORT_SCHEMA.md` existed
in the repo before this run, and no `run.py` orchestrator is present. The agent
prompt references both, but per Hard Rule #2 I cannot write outside
`agent/memory/` and `agent/reports/`, so those artifacts must be created by
Thomas or a follow-up session, not by me.

### De-facto report format (in use until a real schema lands)

Until `docs/BUG_REPORT_SCHEMA.md` exists, all reports use the following shape.
The parser Thomas builds should key off these anchors so it works with today's
report too.

```
# Telos Bug Hunter - YYYY-MM-DD

- **Focus**: Functional | Visual/UX | Performance | Security
- **Findings**: <integer count>
- **Zero-bug day**: <true|false>

---

## <SEVERITY> - <short title>            <- one `##` heading per bug
- **ID**: YYYY-MM-DD-NN                   <- date + zero-padded index in day
- **Severity**: P0 | P1 | P2 | P3
- **Focus**: <focus name>
- **File(s)**: path:line, path:line       <- comma-separated file:line refs
- **Symptom**: one-sentence user-visible symptom
- **Evidence**: reproducer / measurement / grep hit / calculation
- **Fix**: concrete recommended change (one paragraph or a short bulleted patch)
- **Confidence**: high | medium | low
```

A `## <SEVERITY> - <title>` heading with no bugs beneath it is invalid; if there
are zero findings, omit the section entirely and write a single paragraph under
the frontmatter explaining the day was clean.

## Codebase orientation (first-run notes)

- Static HTML + serverless functions on Vercel. No bundler, no build step,
  so "bundle size" is really "raw HTML/JS file size" per route.
- Every marketing HTML page loads `css/style.css?v=16` and (for public pages)
  `js/main.js`. Dashboards are self-contained (`thomas.html`,
  `client-dashboard.html`) and do NOT load `main.js`.
- `CLAUDE.md` documents `index.html`, `pricing.html`, `chs.html`,
  `protein-calculator.html`, `hyrox-predictor.html`, `resources.html`,
  `thomas.html`, `client-dashboard.html`, plus the blog. `product.html`,
  `shop.html`, and `js/shop.js` exist in the repo but are NOT mentioned in
  `CLAUDE.md` - possibly newer work not yet documented. Worth a pass on a
  future Functional day.
- Serverless endpoints under `/api` are grouped: `submit-*` (public),
  `client/*` (client session), `dashboard/*` (admin session), `cron/*`
  (require `CRON_SECRET`). `lib/redis.js` exposes a pipelining helper
  `redisPipeline` used by well-optimized endpoints like `dashboard/stats.js`.
- Known limitations from `CLAUDE.md` that must NOT be re-flagged:
  - Whop iframe + Safari/iOS third-party cookie block on client login.
  - Tool pages missing `main.js` (P1-P3 backlog).
  - `.html` extensions in some internal links (P1-P3 backlog).
  - `todayStr()` UTC timezone bug in client dashboard streaks (P1-P3 backlog).
  - `sw.js` cache name `telos-v1` needs bumping when cached assets change
    (P1-P3 backlog).

## False-positive patterns to avoid

- Reporting an item that appears in `CLAUDE.md`'s "Known Limitations" section
  as a new bug. Those are triaged and tracked elsewhere.
- Reporting "could be cleaner" or "consider using X pattern" - those are
  preferences, not bugs.
- Reporting a `console.log` or debug leftover unless it exposes user data.

## Patterns worth continuing to check

- **Image weight vs. rendered size** - a photo shipped at 3x its display
  dimensions is always a real perf win to fix; measure with `file`
  (dimensions) and `ls -l` (bytes).
- **Eager below-the-fold `<img>`** - `grep 'loading=' *.html` gives a fast
  read on how many images opt out of lazy loading; a hit count near zero on
  a page with multiple images is a red flag.
- **`ZREVRANGE ... 0 -1` on paginated endpoints** - fetches the whole set
  every request; scales poorly. Look for it in `api/dashboard/*` handlers
  that accept `limit` and `offset`.
