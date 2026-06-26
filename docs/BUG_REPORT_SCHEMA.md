# Bug Report Schema

Each daily report is a Markdown file at `agent/reports/YYYY-MM-DD.md` with the following structure.

## Required front matter

```
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
bugs_found: <integer>
---
```

## Body sections

1. `# Telos Bug Hunter - YYYY-MM-DD`
2. `## Summary` - one paragraph: focus area, what was inspected, top-line conclusion
3. `## Findings` - one `### BUG-YYYY-MM-DD-NN: <title>` block per bug, in priority order
4. `## Notes` (optional) - non-bug observations worth surfacing

## Per-bug block

Each `### BUG-YYYY-MM-DD-NN` block must contain:

- **Severity**: P0 | P1 | P2 | P3
- **Area**: short label (e.g. "client portal", "cron", "shop checkout")
- **File(s)**: repo-relative paths with line numbers when applicable
- **Symptom**: one or two sentences describing the user-visible problem
- **Root cause**: code-level explanation
- **Reproduction**: numbered steps OR exact code path
- **Fix sketch**: one to three sentences proposing the change

## Zero-bug report

If no bugs are found, the body may simply read:

```
## Summary

Focus: <area>. Inspected: <areas inspected>. No issues meeting the severity bar were found.
```

The report MUST still include the `---` front matter with `bugs_found: 0`.
