# Bug Report Schema

Reports live at `agent/reports/YYYY-MM-DD.md` and follow this structure exactly. The orchestrator parses these files to build the email digest, so deviations break delivery.

## File header

```markdown
# Telos Bug Hunter — YYYY-MM-DD

- **Focus:** Functional | Visual/UX | Performance | Security
- **Bugs found:** N
- **Approval rate (last 14 days):** X% (Y approved / Z total)
- **Run duration:** Mm Ss
```

If `Bugs found` is `0`, the body must be a single section titled `## No bugs found` with a 1-3 sentence note explaining what was checked. Do not pad.

## Bug entry

Each bug is its own H2 section. Required fields appear as a definition list directly under the heading. Order of fields is fixed.

```markdown
## [P0|P1|P2|P3] Short imperative title (under 80 chars)

- **ID:** YYYY-MM-DD-NN  (NN = 01, 02, ... within the day)
- **Severity:** P0 | P1 | P2 | P3
- **Area:** e.g. client-dashboard / api / chs / pricing / blog / shared
- **File(s):** `path/to/file.js:LINE` (one per line, repeated as needed)
- **Type:** logic | security | a11y | perf | data | regression | ux

### What's wrong
1-3 sentences describing the actual defect. Be specific. Quote code when useful.

### Repro
Numbered steps a developer can follow, or a code trace pointing at the exact lines. If the bug is data-only or static, "Static analysis" with the file:line is acceptable.

### Why it matters
1-2 sentences on user/business impact. Tie to severity.

### Suggested fix
A concrete one-line change or a brief patch sketch. Do not write full diffs unless trivial.
```

## Validation rules

- Severity in heading must match the `Severity:` field.
- `ID` must be unique within the day and globally referenced when re-flagging unresolved bugs (`(re-flag of YYYY-MM-DD-NN, still unresolved)`).
- `File(s)` paths are repo-relative.
- No bug section may exceed ~30 lines. If it does, the issue is too broad — split it or downgrade scope.
- The whole report should rarely exceed ~400 lines. If you have more than 8 findings in a day, you are likely over-reporting; raise your bar.

## Footer

End every report with:

```markdown
---

## Memory updates
- Brief bullets noting what was added to `agent/memory/learnings.md` this run.

## Tomorrow's focus
- Visual/UX | Performance | Security | Functional (whichever rotates next)
```
