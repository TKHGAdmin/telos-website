# Bug Report Schema

Every daily report written by the Telos Bug Hunter must follow this format so the parser (used by `run.py` for emailing) can extract findings reliably.

## File location

`agent/reports/YYYY-MM-DD.md`

## Structure

```markdown
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Findings:** N total (P0: n, P1: n, P2: n, P3: n)

## Summary

One or two sentences describing today's hunt at a high level. If zero bugs, say so.

## Findings

### [P0|P1|P2|P3] <bug-id> — <short title>

- **File(s):** `path/to/file.js:LINE` (comma-separated if multiple)
- **Severity:** P0 | P1 | P2 | P3
- **Category:** functional | visual | performance | security
- **Summary:** One sentence stating the defect.
- **Repro:** Concrete steps or code trace that shows the bug.
- **Impact:** Who is affected and how.
- **Proposed fix:** Short description of the change that would resolve it (do NOT modify code — just describe).

(Repeat per finding.)

## Notes

Optional. Patterns observed, areas skipped, or context for future runs.
```

## Rules

1. `<bug-id>` format: `BUG-YYYYMMDD-NN` (NN = 01, 02, ...).
2. Severity in the heading matches the `Severity:` field.
3. `File(s)` uses `path:line` format so an editor can jump directly.
4. Zero findings: still emit the file with the Summary section stating "No new bugs found today." and an empty Findings section (or omit it).
5. Never include screenshots or binary attachments — Markdown text only.
