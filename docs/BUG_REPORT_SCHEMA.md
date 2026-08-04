# Bug Report Schema

Each daily report is a single Markdown file at `agent/reports/YYYY-MM-DD.md` following the exact schema below. The parser depends on this structure — do not deviate.

## File Structure

```markdown
# Telos Bug Hunter Report - YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Findings:** N
**Approval rate (30d):** X% (Y/Z)

## Summary

<1-3 sentence executive summary. If zero findings, say so plainly.>

---

## Findings

### F1 - [Pn] Short title

- **File:** `path/to/file.js:LINE`
- **Category:** functional | ui | perf | security | tech-debt
- **Severity:** P0 | P1 | P2 | P3
- **Confidence:** high | medium | low

**What breaks**

<Concrete description of the defect — exact inputs/state that trigger it, exact wrong output/behavior.>

**Reproduction**

1. <step>
2. <step>
3. <step>

**Fix suggestion**

<Optional: 1-3 sentence hint. Not required.>

---

### F2 - [Pn] ...

(repeat for each finding)

---

## Zero-finding report format

If no bugs were found, use this instead of the Findings block:

```
## Findings

None.

**What was checked**
- <area 1>
- <area 2>
- <area 3>

**Why zero is honest today**
<One sentence — e.g. "recently landed diff was small and reviewed; no new attack surface.">
```

## Rules

1. Bug IDs are `F<N>` sequential within the report, starting at F1.
2. Every finding must have `File:`, `Category:`, `Severity:`, `Confidence:`.
3. `**What breaks**` and `**Reproduction**` are required.
4. `**Fix suggestion**` is optional; skip if unclear.
5. Order findings by severity (P0 first).
6. Never invent categories or severities not in the enums above.
