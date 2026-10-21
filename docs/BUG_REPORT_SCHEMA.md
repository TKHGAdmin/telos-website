# Bug Report Schema

The Telos Bug Hunter agent emits one Markdown report per run at `agent/reports/YYYY-MM-DD.md`. This document is the contract the `run.py` orchestrator parses.

## File layout

```markdown
# Telos Bug Hunter — YYYY-MM-DD

- **Focus:** <Functional | Visual/UX | Performance | Security>
- **Findings:** <N>
- **Approval target:** <"high-precision" | "high-recall">

---

## Summary

<One paragraph. If zero findings, say so plainly.>

---

## Findings

### [BUG-YYYYMMDD-NN] <Short title>

- **Severity:** <P0 | P1 | P2 | P3>
- **File(s):** `path/to/file.ext:line` (comma-separated)
- **Area:** <marketing-site | admin-dashboard | client-portal | api | infra>
- **Reproducible:** <yes | no>

**What is wrong**

<One or two sentences stating the defect, concretely.>

**Why it matters**

<One or two sentences on user/dev impact. No speculation.>

**Suggested fix**

<Short, actionable. Not an implementation.>

---
```

## Rules

1. Each finding gets its own `###` heading with the bracketed BUG id.
2. BUG ids are `BUG-YYYYMMDD-NN` where NN is zero-padded, starting at 01 per report.
3. Severity, File(s), Area, Reproducible are mandatory on every finding.
4. If zero findings, keep the `## Findings` heading and the body `_No findings today._`.
5. Never pad. A zero-bug day is a valid day.
