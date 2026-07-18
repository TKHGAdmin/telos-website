# Bug Report Schema

The daily bug hunter writes a single Markdown file at `agent/reports/YYYY-MM-DD.md`. The parser depends on this exact structure. Do not deviate.

## File header (required)

```markdown
# Telos Bug Hunter Report - YYYY-MM-DD

- **Focus:** Functional | Visual/UX | Performance | Security
- **Bugs found:** N
- **Zero-bug run:** true | false
```

## Body

If `Bugs found` is 0, write:

```markdown
## Summary

No actionable bugs found today. Areas scanned: <list>.
```

Otherwise, for each bug, use this exact section format. Bugs are ordered most-severe first.

```markdown
## BUG-YYYYMMDD-N: <one-line title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <e.g., api/client, js/quiz.js, client-dashboard.html>
- **File:** <path>:<line-range>

**What's wrong**

<1-3 sentences plainly describing the defect.>

**Reproduction**

<Exact steps or code trace showing how the bug manifests.>

**Impact**

<Who is affected and how. Real user impact only.>

**Suggested fix**

<Concrete direction. Not required to be a complete patch.>
```

## Footer (required)

```markdown
---

- **Focus tomorrow:** <next area in rotation>
- **Approval rate to date:** <N/M or N/A>
```

## Rules

- Bug IDs use the report date and a per-day index: `BUG-20260718-1`, `BUG-20260718-2`, ...
- Never include stack traces or dumps longer than 10 lines.
- Never include secrets. Redact with `REDACTED`.
- Never fabricate. A zero-bug report is a valid report.
