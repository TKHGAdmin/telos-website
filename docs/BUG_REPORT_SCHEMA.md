# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this schema.
The orchestrator parses these reports — deviation breaks the email pipeline.

## Required header (top of file)

```
# Telos Bug Hunt — YYYY-MM-DD

- **Focus:** Functional | Visual/UX | Performance | Security
- **Bugs found:** <integer>
- **Approval rate (last 30d):** <percent or "n/a">
```

## Per-bug section

Each bug is its own H2. The slug after `BUG-YYYYMMDD-N:` must be unique within
this report.

```
## BUG-YYYYMMDD-N: <Short title>

- **Severity:** P0 | P1 | P2 | P3
- **File(s):** path/to/file.js:LINE-LINE
- **Status:** new | recurring (ref BUG-YYYYMMDD-N)

### What's wrong
<1-3 sentences — the defect, plainly stated.>

### How to reproduce
<Numbered steps OR a code trace pointing to the exact lines.>

### Why it matters
<Who is affected, what they experience, severity rationale.>

### Suggested fix
<Concrete change, ideally a diff sketch or function-level edit.>
```

## Zero-bug report

If no bugs were found, the body after the header is exactly:

```
No actionable bugs found today. Code paths examined: <bulleted list>.
```

Do not pad with "things to consider" or "future improvements" — those belong
in `agent/memory/learnings.md`.

## Hard rules

- Never invent a bug to look productive. A zero-bug day is honest.
- Never include a bug already reported in the last 14 days unless marked
  `recurring` with the prior ID.
- Every bug must cite a file path and line range. If you can't, you don't
  understand it well enough to report it yet.
