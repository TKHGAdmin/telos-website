# Telos Bug Hunter — Learnings

## About this file

Running notes from the autonomous Bug Hunter. The orchestrator seeds this on first
run with what's known about the codebase's shape and false-positive patterns to
avoid. Future runs append.

Keep under 2000 lines. Compress older entries into summaries when needed.

---

## Codebase shape (as of 2026-11-12)

- Pure HTML/CSS/JS, no build step, Vercel static + serverless. See CLAUDE.md for canonical
  structure and Redis keys. CLAUDE.md is the source of truth — if a finding contradicts it,
  the finding is almost certainly real or CLAUDE.md is stale (worth a flag either way).
- Two independent dashboards: `thomas.html` (admin, self-contained) and
  `client-dashboard.html` (client PWA, self-contained). Neither loads `js/main.js` or
  `css/style.css`. Do not report "missing main.js" on those two.
- Public marketing pages DO load `js/main.js`. `body.page-load-anim` is intentionally
  only on `index.html` (per CLAUDE.md).
- Tool pages (protein-calculator, hyrox-predictor) have inline page scripts and must
  NOT re-register hamburger/nav handlers (main.js owns that).
- CSS cache-busting is `?v=N`. Currently `?v=16` per CLAUDE.md; drift is a real bug.
- Clean URLs via vercel.json — internal links intentionally omit `.html`. Do NOT
  report an internal link as "missing .html".
- Service worker: `sw.js`, cache name `telos-v1`. CLAUDE.md notes cache-bump is on
  the known-backlog; only flag if it's materially stale or missing a new critical asset.
- `coaches.html`, `product.html`, `shop.html`, `set-password.html` are recent
  additions (Oct–Nov 2026). Treat them as highest likelihood of regressions.

## False-positive patterns to avoid

(empty — populate from denials)

## Known limitations already acknowledged by Thomas (do NOT re-report)

From CLAUDE.md "Known Limitations":
- Whop iframe on Safari/iOS login (third-party cookies). Known.
- Bug crawl P1–P3 backlog from April 2026 commit 7fa38ff. Items listed there are
  not fresh findings:
  - "tool pages missing main.js" — known backlog; only flag if a NEW tool page
    regressed, not the known ones.
  - ".html extensions in internal links" — known backlog; low priority.
  - "todayStr() UTC timezone bug in client dashboard streaks" — known.
  - "SW cache version bump needed" — known.
- Do not report any of the above unless the specific instance is clearly outside
  what commit 7fa38ff documented.

## Report format (schema notes)

`docs/BUG_REPORT_SCHEMA.md` is referenced by the instructions but does not exist
in the repo. First-run convention (locked in so later runs stay parse-compatible):

```
# Telos Bug Hunter — <YYYY-MM-DD>

- Focus: <functional|visual_ux|performance|security>
- Scope: Telos Fitness web platform (TKHGAdmin/telos-website)
- Findings: <N>

## Summary

One-paragraph plain-language summary. If zero bugs: say so and stop.

## Findings

### [P0|P1|P2|P3] <short title> — `<path/to/file.ext>:<line>`

**Summary.** One sentence.

**Repro / evidence.** 2–4 sentences. Include a short code excerpt only if it anchors
the finding.

**Suggested fix.** One sentence, action-oriented. Do not write the patch.

(repeat per finding, highest severity first)

## Coverage notes

Areas / files touched this run, and what was deliberately skipped.
```

Parser contract: H1 starts with "Telos Bug Hunter", each finding is an H3 whose
line starts with `### [P<0-3>]`. File:line reference in backticks after an em-dash
or hyphen. Keep this stable — the email orchestrator reads it.

## Run history

- 2026-11-12 — First run. Focus: functional. See report.
