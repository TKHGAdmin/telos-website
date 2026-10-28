# Bug Report Schema

Reports live at `agent/reports/YYYY-MM-DD.md`. The parser depends on this exact structure.

## Required front matter

```
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bug_count: <integer>
---
```

## Body

If `bug_count == 0`, write a single short paragraph confirming the hunt ran and nothing survived the triage gate. Nothing else.

If `bug_count > 0`, emit one `## Bug <id>` section per finding in severity order (P0 first). Each section must contain, in order:

- `**Severity:** P0 | P1 | P2 | P3`
- `**File:** <repo-relative path>:<line>` (or `multiple` if cross-file)
- `**Summary:** <one sentence>`
- `### Reproduction`  — numbered steps or a code trace
- `### Impact`  — who it affects and how
- `### Suggested fix`  — concrete change, not a vague direction

Bug IDs are `YYYY-MM-DD-NN` (NN zero-padded, starts at 01). Reference prior bug IDs when flagging a recurrence.

## Hard constraints

- No emojis.
- No speculation ("could possibly", "might be"). If uncertain, the bug does not belong in the report.
- No style or taste commentary.
- Redact any secret you find: `sk-ant-api03-REDACTED` form.
