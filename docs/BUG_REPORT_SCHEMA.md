# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this schema. The email parser depends on exact section headings and the fenced YAML front matter.

## File layout

```
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bugs_found: <integer>
recommend_review: true | false
---

# Telos Bug Hunter — YYYY-MM-DD

**Focus**: <focus area>
**Duration**: <how long the run took>
**Verdict**: <one sentence: "No bugs found this pass" OR "N verified bugs, X P0/P1">

## Summary

<2-4 sentences. What areas were checked, what the overall shape of the day is.>

## Bugs

<one `### Bug: <ID> - <short title>` block per finding, most severe first. If none: write "No bugs found this pass." and skip the rest of the section.>

### Bug: YYYY-MM-DD-01 - <short title>

- **Severity**: P0 | P1 | P2 | P3
- **Category**: functional | visual-ux | performance | security
- **File**: `<repo-relative path>:<line>`
- **First seen**: YYYY-MM-DD (this report, or prior report if recurring)
- **Description**: <one paragraph>
- **Failure Scenario**: <concrete inputs/state → wrong output/crash>
- **Evidence**:
  ```<lang>
  <exact code snippet, 3-15 lines>
  ```
- **Suggested Fix**: <one or two lines>
- **Confidence**: high | medium (never include "low")

## Areas Checked

<bulleted list of files/systems inspected — helps track coverage over time>

## Notes

<optional: patterns worth remembering, false-positive pitfalls avoided, follow-ups that need a human decision>
```

## Rules

1. **YAML front matter is required.** Missing fields fail the parser.
2. **Bug IDs** are `YYYY-MM-DD-NN` — zero-padded, sequential per day.
3. **Never invent a bug.** `bugs_found: 0` with `## Bugs` reading "No bugs found this pass." is a valid, honest report.
4. **Never include "low" confidence bugs.** Triage them out.
5. **Every bug MUST have a file path with a line number.** No exceptions.
6. **Every bug MUST have a concrete Failure Scenario.** "Could theoretically break" is not a scenario.
7. **Recurring bugs**: use the ORIGINAL bug's ID in the title (e.g. `### Bug: 2026-08-14-02 - <title> (still unresolved)`) and set `First seen` to the original date.
8. **Total report length**: keep under 1500 lines. If longer, triage harder.
