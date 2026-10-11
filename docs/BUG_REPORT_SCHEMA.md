# Bug Report Schema

Daily bug reports produced by the Telos Bug Hunter agent follow this exact structure. The orchestrator (`run.py`) parses these files to send email summaries and track approvals, so deviation breaks the pipeline.

## File location

```
agent/reports/YYYY-MM-DD.md
```

One file per run, named by the UTC calendar date the run started.

## File structure

```markdown
# Telos Bug Hunter - YYYY-MM-DD

- **Focus**: Functional | Visual/UX | Performance | Security
- **Findings**: <integer>
- **Status**: findings | clean

## Summary

<One short paragraph. Plain prose. If zero findings, say so.>

## Findings

### [SEVERITY] <slug-id>: <Short title>

- **Severity**: P0 | P1 | P2 | P3
- **File(s)**: `path/to/file.js:LINE` [, `other.js:LINE` ...]
- **Category**: functional | visual | performance | security
- **Discovered**: YYYY-MM-DD

**What's wrong**

<One or two sentences stating the defect.>

**How to reproduce / confirm**

<Exact steps or code trace. Line references required.>

**User impact**

<Who is affected and how.>

**Suggested fix**

<Minimal change. One or two sentences max.>
```

## Rules

1. **One `## Findings` section per report.** If zero findings, replace it with the line `_No findings today._` and set `Status: clean`.
2. **Each finding uses `### [SEVERITY] slug-id: Title`.** The `slug-id` is a short kebab-case handle unique within the file (e.g. `quiz-no-validation`, `orphan-client-email`).
3. **Severity levels**: see agent prompt. Only P0/P1/P2/P3.
4. **File references** use `path:line` format with no leading slash and lines must exist in the current repo tree.
5. **No prose outside the headings shown above.** The parser depends on this layout.
6. **Max 10 findings per report.** If more are suspected, keep the top 10 by severity + confidence and note the rest in `learnings.md` for a future run.

## Example (zero-finding day)

```markdown
# Telos Bug Hunter - 2026-10-11

- **Focus**: Functional
- **Findings**: 0
- **Status**: clean

## Summary

Walked critical paths: quiz submission, client login, daily-log and training-log POSTs, Shopify cart. No new defects found that are not already in the April 2026 backlog (CLAUDE.md).

_No findings today._
```
