# Bug Report Schema

The daily report file at `agent/reports/YYYY-MM-DD.md` MUST follow this schema exactly. The run.py parser depends on it.

## File naming
`agent/reports/YYYY-MM-DD.md` (ISO date, UTC).

## Required sections

```markdown
# Telos Bug Hunter - YYYY-MM-DD

**Focus**: Functional | Visual/UX | Performance | Security
**Scanned**: <comma-separated list of top-level areas inspected>
**Findings**: N

---

## Summary

<One or two sentences. Plain English. If zero findings, say so plainly here and leave the Findings section empty.>

---

## Findings

### [P0|P1|P2|P3] <short title>

- **ID**: `YYYY-MM-DD-NN` (sequential within the day, zero-padded)
- **File**: `path/to/file.ext:line` (or multiple)
- **Area**: Functional | Visual/UX | Performance | Security
- **Reproduction**: <exact steps or exact lines a reviewer can inspect>
- **Impact**: <who it affects and when>
- **Suggested fix**: <one or two sentences, concrete>

---
<repeat for each finding>
```

## Rules
- No padding. No lorem. No "could be improved" entries.
- Severity order descending (P0 first).
- Each finding must be independently actionable without the agent in the loop.
- If zero findings, keep the header and Summary; omit the Findings block entirely.
