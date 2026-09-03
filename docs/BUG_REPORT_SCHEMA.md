# Bug Report Schema

The daily bug hunter emits a single Markdown file at `agent/reports/YYYY-MM-DD.md` following this schema. The email/parser pipeline depends on this exact structure.

## Required frontmatter

```
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bugs_found: <integer>
run_status: ok | error | skipped
---
```

## Body sections (in order)

### 1. `# Telos Bug Hunter - YYYY-MM-DD`
Single H1 with the date. Nothing else on this line.

### 2. `## Summary`
2-4 sentences describing what was hunted, what was found. If zero bugs, say so plainly.

### 3. `## Findings`
Zero or more bug entries. Each entry uses this exact structure:

```
### [P0|P1|P2|P3] <short title, one line>
- **File**: `path/to/file.ext:line`
- **Category**: <category slug, e.g. security-auth, cleanup-orphan, ux-mobile>
- **Reproduction**:
  <1-6 lines describing exact reproduction or code trace>
- **Impact**:
  <1-3 lines on who is affected and how>
- **Suggested fix**:
  <1-3 lines on the smallest correct fix>
```

If zero bugs, write:
```
_No bugs found today._
```

### 4. `## Notes`
Optional. Areas explored, patterns worth flagging that didn't rise to a bug, and any tooling issues encountered during the run.

## Rules

- Severity ordering: bugs MUST appear P0 → P1 → P2 → P3.
- File paths are repo-relative.
- Never include secrets, even redacted ones, outside of a P0 finding explicitly flagged as such.
- One bug per `### [PN]` heading. Never combine multiple issues into one entry.
- Keep short titles under 80 characters.
