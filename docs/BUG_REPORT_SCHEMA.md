# Bug Report Schema

The daily Bug Hunter writes one Markdown file per run at `agent/reports/YYYY-MM-DD.md`.
This file documents the required structure. The email-emit step parses it; deviations break the pipeline.

---

## File location

`agent/reports/YYYY-MM-DD.md` (UTC date, zero-padded month and day).

## Required frontmatter

```
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bugs_found: <integer>
run_status: clean | findings | error
---
```

## Body structure

### When `bugs_found == 0`

A single section:

```
## No findings

<one-sentence summary of what was checked and why nothing made the cut>
```

That is the entire body. Do not pad.

### When `bugs_found > 0`

One `## Bug` section per finding, in priority order (P0 first). Each section must contain
exactly these fields, in this order:

```
## Bug <N> - <P0|P1|P2|P3> - <short title>

**ID:** BUG-YYYY-MM-DD-<NN>
**Severity:** P0|P1|P2|P3
**Area:** <subsystem, e.g. "client-dashboard", "api/cron", "quiz.js">
**Files:** <comma-separated relative paths with optional :line refs>

### What's broken
<2-4 sentence description of the symptom>

### Reproduction
<numbered list of steps, or a precise code/data trace pointing to lines>

### Impact
<who is affected and how, in 1-2 sentences>

### Suggested fix
<1-3 sentence proposal — concrete, not vague>
```

## Hard rules for the parser

- Frontmatter must be the very first content in the file (no blank line above).
- `bugs_found` must equal the count of `## Bug` sections (or be `0`).
- Bug IDs must be unique per file and increment from `01`.
- No HTML, no images, no tables outside fenced code blocks.
- Use plain ASCII hyphens, not em-dashes.
