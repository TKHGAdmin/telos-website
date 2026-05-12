# Bug Report Schema

Each daily report must be a single Markdown file at `agent/reports/YYYY-MM-DD.md`
and conform to the structure below. The orchestrator parses the headings, so
do not rename or reorder them.

## File Header

```
# Telos Bug Hunter Report — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N
**Approval requested:** Yes | No (zero-bug days)
```

## Sections (in order)

### 1. Summary
One paragraph. What you looked at, what you found, what stood out. No fluff.

### 2. Bugs
Zero or more bug entries. Each entry uses this template:

```
#### BUG-YYYY-MM-DD-NN — <one-line title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <file or feature>
- **Status:** new | recurring (refs BUG-YYYY-MM-DD-NN)

**What's wrong:**
<2-4 sentences describing the defect>

**Where:**
- `path/to/file.ext:line` (use file:line so editors can jump)

**Repro / evidence:**
<exact steps, sample input, or quoted code>

**Suggested fix:**
<one paragraph; do NOT write a patch>
```

Numbering: `NN` starts at `01` each day, incrementing per bug in that day's report.

### 3. Notes / Observations
Optional. Things worth flagging that did not meet the bug bar (patterns,
follow-up ideas, areas to revisit). Keep terse.

### 4. Out of scope / skipped
Optional. Anything explicitly not checked today and why.

## Zero-bug days

If no bugs were found, the Bugs section should contain a single line:

```
_No bugs found today._
```

The summary should still explain what was checked.
