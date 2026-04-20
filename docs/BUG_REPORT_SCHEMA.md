# Bug Report Schema

The Telos Bug Hunter emits one Markdown file per day at `agent/reports/YYYY-MM-DD.md`.
The file must conform to this schema so the downstream parser / email formatter can
render it reliably.

---

## Top-level structure

```markdown
# Telos Bug Hunter Report - YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Bugs found:** <N>
**Summary:** <1-2 sentence plain-English summary>

---

## Bugs

<zero or more bug blocks, each conforming to the Bug Block schema below>

---

## Notes

<optional freeform notes, e.g. "explored /api/client/ for the first time">
```

If zero bugs were found, the `## Bugs` section contains the single line:

```
No bugs found today.
```

---

## Bug Block schema

Each bug is a block of the form:

```markdown
### [P<0-3>] <short title>

**ID:** YYYY-MM-DD-<nn>
**Severity:** P0 | P1 | P2 | P3
**Area:** <e.g. api/client/login, client-dashboard.html, css/style.css>
**Status:** new

**What's wrong:**
<1-3 sentences describing the bug>

**Where:**
- `<file_path>:<line_number>` - <brief description>
- <additional locations if relevant>

**Repro / evidence:**
<steps to reproduce, code excerpt, or the specific condition that triggers it>

**Suggested fix:**
<1-3 sentences, concrete recommendation>
```

---

## Field rules

- **ID** - `YYYY-MM-DD-NN` where NN is a zero-padded counter starting at 01 for the day.
- **Severity** - one of P0 / P1 / P2 / P3 per the rubric in `AGENTS.md`.
- **Area** - the file/path/module affected. Prefer the narrowest accurate scope.
- **Status** - always `new` when first reported. The decisions file tracks approval state separately.
- **Where** - at least one `path:line` reference. Use backticks around the path.
- **Repro / evidence** - must be concrete. Speculative bugs are excluded at triage.
- **Suggested fix** - actionable. "Consider refactoring" is not acceptable.

---

## Parser contract

The parser splits on `^### \[P[0-3]\]` to find bug blocks and extracts fields by
literal `**Field:**` markers. Do not add or rename fields without updating the
parser too.
