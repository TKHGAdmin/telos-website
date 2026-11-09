# Bug Report Schema

Every daily report written to `agent/reports/YYYY-MM-DD.md` must follow this schema. The email digest parser depends on it.

## Front matter

```
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
total_findings: N
---
```

## Body

### Summary

A one-paragraph plain-English summary of what was hunted and what was found. If zero bugs, say so plainly here and stop.

### Findings

For each finding, use this exact structure (H3 heading, then labelled lines, then prose). The `[BUG-YYYY-MM-DD-NN]` ID must be unique within the day; number starts at 01.

```
### [BUG-YYYY-MM-DD-NN] Short descriptive title

- **Severity:** P0 | P1 | P2 | P3
- **Area:** short slug (e.g. `client-dashboard`, `api/client`, `admin/thomas`, `blog`, `homepage`)
- **File(s):** path/to/file.js:line, path/to/other.html:line
- **Status:** new | recurring (reference prior BUG-ID if recurring)

**What's wrong.** One or two sentences describing the defect.

**How to reproduce.** Exact steps or the exact code trace that demonstrates it.

**Impact.** Who is affected and how.

**Suggested fix.** One or two sentences. Optional snippet.
```

## Rules

- Severity must be one of P0/P1/P2/P3 exactly.
- `File(s)` must use repo-relative paths. Include `:line` when meaningful.
- If total_findings is 0, the Findings section is omitted entirely and the summary is a single short paragraph.
- Do not add extra sections. Do not add decorative headers. The parser is strict.
