# Bug Report Schema

The Telos Bug Hunter writes one Markdown file per run at `agent/reports/YYYY-MM-DD.md`. The orchestrator (`run.py`) and the email layer parse this file. **Do not deviate from this schema.**

---

## File location

```
agent/reports/YYYY-MM-DD.md
```

`YYYY-MM-DD` is the run date in UTC.

---

## Top-level structure

The file MUST contain, in order:

1. A YAML front-matter block bounded by `---` lines.
2. A single H1 title line.
3. A `## Summary` section.
4. Zero or more `## Bug N — Title` sections.
5. A `## Notes` section (optional but recommended).

---

## Front matter

```yaml
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bugs_found: <integer>
p0: <integer>
p1: <integer>
p2: <integer>
p3: <integer>
---
```

All fields are required. Counts MUST match the bug sections below.

---

## Summary section

```
## Summary

<1-3 sentences describing what was hunted today, what was found, and a one-line verdict.>
```

If zero bugs were found, state that plainly.

---

## Bug section

For each bug, exactly:

```
## Bug N — <short title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <file or feature, e.g. `js/quiz.js` or "Client login flow">
- **First seen:** YYYY-MM-DD (this run, unless recurring)

### What's wrong

<2-5 sentences describing the actual defect.>

### How to reproduce

<Numbered steps, OR a code/grep reference that shows the bug.>

### Suggested fix

<1-3 sentences. High-level, not a patch. Optional code snippet allowed.>
```

`N` is 1-indexed within the report.

---

## Notes section

```
## Notes

<Anything that didn't qualify as a bug but is worth flagging for context: things ruled out, areas you didn't reach, follow-ups for tomorrow.>
```

---

## Zero-bug report

If nothing qualifies, the file is still required. Use:

```yaml
---
date: YYYY-MM-DD
focus: <today's focus>
bugs_found: 0
p0: 0
p1: 0
p2: 0
p3: 0
---

# Telos Bug Hunter Report — YYYY-MM-DD

## Summary

No qualifying bugs found in today's <focus> sweep. <One sentence on what was checked.>

## Notes

<Optional: ruled-out candidates, areas covered, what to revisit tomorrow.>
```

---

## Parser contract

- Front matter is YAML. No tabs, no trailing commas.
- Bug headings match `^## Bug \d+ — .+$`.
- Severity matches `^- \*\*Severity:\*\* (P0|P1|P2|P3)$`.
- The `bugs_found` count MUST equal the number of `## Bug N` sections.
- The `p0` / `p1` / `p2` / `p3` counts MUST equal the count of each severity across the sections.

Breaking the schema causes the email render to fail.
