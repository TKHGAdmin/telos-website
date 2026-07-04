# Bug Report Schema

The Telos Bug Hunter emits one Markdown file per day at `agent/reports/YYYY-MM-DD.md`. The `run.py` orchestrator parses this file to build the email digest, so the structure below is a contract — deviate and the parser fails.

## File name

`agent/reports/YYYY-MM-DD.md` — always the local date the run started, zero-padded.

## Top-of-file frontmatter (YAML)

```yaml
---
date: YYYY-MM-DD
focus: Functional | Visual/UX | Performance | Security
bug_count: <integer>
run_id: <string, e.g. yyyy-mm-dd-focus>
---
```

## Body

### Summary

Two to four sentences. Plain English. What was inspected today, what came up, and — if zero bugs — say so plainly.

### Bugs

For each bug, use the exact heading format:

```
### BUG-<N> — <P0|P1|P2|P3> — <One-line title>
```

`<N>` is a per-day sequence starting at 1. Under each heading:

- **File(s):** repo-relative path(s), one per line if multiple
- **Location:** `path:line` anchors where the defect lives
- **What's wrong:** one paragraph
- **Repro / evidence:** exact steps to reproduce OR the code excerpt that proves the defect
- **Impact:** one sentence — who is affected and how
- **Suggested fix:** one to three sentences; may be a code stub

### Zero-bug body

If no bugs, replace the `### Bugs` section with:

```
### Bugs

None today. See summary for what was inspected.
```

## Rules

1. No emojis anywhere in the report.
2. No em dashes. Use hyphens.
3. All severity labels come from the fixed set {P0, P1, P2, P3}.
4. Never edit a previous day's report.
5. Titles are one line only, no trailing punctuation.
