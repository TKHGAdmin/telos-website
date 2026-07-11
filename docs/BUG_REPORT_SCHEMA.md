# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must follow this schema. The email parser depends on it.

## Frontmatter (YAML)

```
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
bug_count: <integer>
approval_status: pending
---
```

## Body sections (in order)

### 1. `# Summary`
One paragraph. What you looked at, how many bugs you found, headline finding.

### 2. `# Findings`
Zero or more bug entries. If zero, write `_No bugs found this run._` and stop.

Each bug entry uses this exact structure:

```
## Bug <N> — <one-line title>

- **Severity:** P0 | P1 | P2 | P3
- **File(s):** `path/to/file.js:LINE` (comma-separated if multiple)
- **Category:** functional | visual | performance | security

### What's wrong
Prose. Describe the defect.

### Steps to reproduce
Numbered list. Concrete inputs → observed vs expected behavior.

### Suggested fix
One paragraph or short code block. Not required to be a full patch.

### Confidence
high | medium | low — how sure you are this is real.
```

### 3. `# Skipped candidates`
Optional. Bullet list of things you considered but excluded, with a one-line reason. Helps Thomas see your judgement calls.

### 4. `# Notes for next run`
Optional. One or two sentences on what you'd hunt next given more time.

---

## Parsing rules

- Frontmatter must be at the top; the email pipeline reads it first.
- Every `## Bug N — ` heading is a distinct bug. `N` is 1-indexed.
- The `- **Severity:**` line must appear on the line after the heading (with one blank line between).
- `File(s)` paths must be repo-relative, backticked, with `:LINE` suffix.
- No em dashes anywhere in the file (hyphens only).
