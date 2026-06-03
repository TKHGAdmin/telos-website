# Bug Report Schema

Reports live at `agent/reports/YYYY-MM-DD.md` and are parsed by `run.py` to drive Thomas's approval workflow.

## Required structure

```markdown
# Telos Bug Hunter Report - YYYY-MM-DD

**Focus area**: Functional | Visual/UX | Performance | Security
**Bugs found**: N
**Notes**: (optional one-line summary; "Zero findings" is valid)

---

## BUG-YYYY-MM-DD-NN
**Severity**: P0 | P1 | P2 | P3
**Title**: <one-line title, < 80 chars>
**Location**: <file:line, route, or component>
**Reproduction**:
1. <step>
2. <step>

**Expected**: <what should happen>
**Actual**: <what actually happens>
**Impact**: <who is affected and how>
**Suggested fix**: <one to three lines>

---
```

## Rules

- IDs are sequential per day: `BUG-2026-06-03-01`, `BUG-2026-06-03-02`, ...
- Headings use the exact strings above (case-sensitive). The parser keys on them.
- One bug per `## BUG-...` block. No nesting.
- `Severity` is one of `P0`, `P1`, `P2`, `P3` (see agent prompt for definitions).
- `Focus area` in the header is one of the four rotating focuses.
- If `Bugs found: 0`, omit all `## BUG-...` blocks and write a single short paragraph instead of a body.
- Never use em dashes (project convention).
