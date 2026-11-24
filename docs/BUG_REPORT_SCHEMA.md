# Bug Report Schema

The Telos Bug Hunter writes one Markdown file per day at `agent/reports/YYYY-MM-DD.md`. The orchestrator (`run.py`, external to this repo) parses these files to render an email digest Thomas can approve or deny.

This schema is the contract. The parser depends on it. Do not deviate.

## File location

```
agent/reports/YYYY-MM-DD.md
```

One file per run, named by the UTC date of the run.

## Required front matter

```
---
date: YYYY-MM-DD
focus: Functional | Visual/UX | Performance | Security
findings: <integer, 0 or more>
---
```

## Required sections, in this order

### 1. `# Telos Bug Hunter - YYYY-MM-DD`

Title line.

### 2. `## Summary`

One or two sentences. State the focus, the number of findings, and the top-line takeaway.
If zero findings, say so plainly. Do not pad.

### 3. `## Findings`

If `findings: 0`, write a single line: `No findings today.` and stop here.

Otherwise, one `### <bug-id>. <short title>` subsection per finding, numbered `1` through N.
The `<bug-id>` is `YYYY-MM-DD-N` where N is a 1-based index (e.g. `2026-11-24-1`).

Each finding subsection must include these labeled lines (in order):

```
- **Severity**: P0 | P1 | P2 | P3
- **Category**: functional | visual | performance | security
- **File**: `path/to/file.ext:line` (or `path/to/file.ext` if line-less)
- **Status**: new | recurring (if recurring, add `(first reported YYYY-MM-DD in <bug-id>)`)
```

Followed by:

```
**What**: One or two sentences stating the defect.

**Why it's wrong**: One short paragraph (3 sentences max) with the concrete failure scenario.

**Suggested fix**: One short paragraph or a small code sketch.
```

### 4. `## Notes` (optional)

Free-form notes for Thomas - areas explored, hunches, questions. Keep under 10 lines.

## Severity rubric

| Severity | Definition |
|---|---|
| P0 | Breaks core functionality or exposes user data |
| P1 | Degrades experience for many users |
| P2 | Affects some users or edge cases |
| P3 | Minor polish or tech debt worth flagging |

## Hard constraints

- No em dashes. Use `-` only.
- All file paths repo-relative.
- No secrets in the body. If a secret is the subject of a finding, mark it `REDACTED` and set severity P0.
- Maximum 10 findings per report. Rank by severity, then by confidence.
- If the file is empty of findings, keep the schema (front matter + sections) and set `findings: 0`.
