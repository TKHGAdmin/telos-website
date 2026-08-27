# Bug Report Schema

Every daily report must follow this exact structure. The `run.py` orchestrator parses these fields and formats the email that goes to Thomas.

Reports live at `agent/reports/YYYY-MM-DD.md` (one per run).

---

## Required frontmatter

```
---
date: YYYY-MM-DD
focus: Functional | Visual/UX | Performance | Security
bugs_found: <integer>
approval_hint: high | medium | low
---
```

- `date`: the run date in UTC
- `focus`: the focus area rotated for this run
- `bugs_found`: total number of bugs in the report (0 is valid)
- `approval_hint`: your own confidence that these bugs will be approved

---

## Body sections

### 1. `# Summary`

One short paragraph. What was hunted, and what shape the day's findings take. No filler.

### 2. `# Bugs`

Zero or more bug blocks. **If zero, write "No bugs found today." and end the report.**

Each bug is a level-2 heading with severity in brackets, then a structured body:

```
## [P0|P1|P2|P3] Short title

**File(s):** `path/to/file.js:LINE`, `path/to/other.html:LINE`
**Category:** functional | visual | performance | security | accessibility | data-integrity
**Reproducibility:** always | sometimes | conditional (describe)

**What's wrong.**

A short paragraph describing the defect grounded in the code. Reference line numbers.

**Repro / failure scenario.**

Concrete steps or inputs that produce the wrong behavior. If it's a code smell that would fail under specific inputs, spell those inputs out.

**Impact.**

Who is affected, how often, what breaks.

**Proposed fix.**

One sentence recommendation. Not required to be the final patch — just enough for Thomas to greenlight or redirect.
```

### 3. `# Notes` (optional)

Anything you want to flag that isn't a bug: patterns to watch, files you couldn't fully cover, questions for Thomas.

---

## Hard rules

- Bugs are ranked most severe first within the report.
- Every bug must cite a specific file and line number.
- Every bug must have a concrete repro or failure scenario — no "this could theoretically fail."
- If bugs_found > 0 but you can't fill all four bug fields for one of them, it does not belong in the report yet.
- No emojis anywhere in the report.
- No em dashes (`—`). Use hyphens.
