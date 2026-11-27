# Bug Report Schema

Each daily report written at `agent/reports/YYYY-MM-DD.md` MUST follow this schema. The run.py orchestrator parses it for email delivery.

## Front matter

```
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
run_id: <ISO timestamp>
total_findings: <int>
---
```

## Body

### Summary
One short paragraph. If zero bugs were found, say so plainly - do not pad.

### Findings
Each finding is a level-3 heading `### B-YYYY-MM-DD-N - Short title` (N starts at 1).

Under each heading, these labeled lines in this exact order:
- `**Severity:**` P0 | P1 | P2 | P3
- `**File(s):**` `path/to/file.js:LINE` (repo-relative, one or more comma-separated)
- `**Area:**` short noun phrase (e.g. "Admin dashboard", "Client login", "Public form")
- `**What:**` 1-2 sentence description of the defect
- `**Repro:**` concrete steps or inputs that trigger it
- `**Impact:**` who's affected and how
- `**Fix hint:**` one line pointing at the shape of the fix (never actual code changes)

### Notes
Optional. Scope changes, blocked areas, false-positive patterns avoided.
