# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST conform to this schema. The email dispatcher parses these files by header structure — deviation breaks delivery.

## File name

- Path: `agent/reports/YYYY-MM-DD.md` (UTC date the run started).

## Required frontmatter (first block)

```yaml
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bug_count: <integer>
status: found | clean
---
```

- `focus` — the rotation area chosen for the run.
- `bug_count` — total findings included below (0 is valid).
- `status` — `clean` when `bug_count == 0`; `found` otherwise.

## Body

### Zero-bug body

If `bug_count == 0`, the body is a single line describing what was checked, e.g.:

```
No functional issues found. Reviewed client auth, quiz + email submit endpoints, and Charleston application flow.
```

Stop there.

### Findings body

For `bug_count > 0`, include one `## BUG-<n>` section per finding, numbered `1..bug_count`. Each finding MUST include these H3 headers verbatim and in this order:

```
## BUG-<n>: <one-line title>

### Severity
P0 | P1 | P2 | P3

### Location
`path/to/file.js:LINE` (one or more; comma-separated if multiple)

### Summary
One or two sentences describing the defect.

### Reproduction
Numbered steps or the exact code path. Concrete inputs → observed wrong output.

### Impact
Who is affected and how. Skip hypothetical harm.

### Suggested fix
One paragraph or a small snippet. Optional — omit the section entirely if you don't have one.
```

## Trailer (optional)

Optional `## Notes` H2 at the bottom for meta-comments to the reader (e.g., "P0 recurrence of BUG from 2026-07-27, unresolved").

## Hard constraints

- No em dashes anywhere. Use `-`.
- File paths in backticks. Line numbers with `:LINE`.
- Never fabricate a bug to fill the report. Zero findings is valid.
- Never include secrets in reproduction steps. Redact as `sk-…-REDACTED`.
