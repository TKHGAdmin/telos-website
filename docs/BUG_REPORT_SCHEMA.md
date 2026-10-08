# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must follow this schema. The orchestrator parses the Markdown — breaking the schema breaks the email.

## File name
`agent/reports/YYYY-MM-DD.md` using the UTC date of the run.

## Required front matter
A YAML block at the very top of the file:

```yaml
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
bug_count: <integer>
---
```

## Required sections

### `# Telos Bug Hunter — YYYY-MM-DD`
Top-level H1 with the date.

### `## Summary`
One or two sentences. State the focus, how many bugs were found, and the overall health signal.

### `## Findings`
Zero or more bug entries. If zero, write a single line: `No bugs found today.` and omit the per-bug schema below.

Each bug is a subsection:

```
### [P0|P1|P2|P3] <short-id>: <one-line summary>

**Severity:** P0 | P1 | P2 | P3
**Area:** <file or subsystem, e.g. api/client/login.js or chs.html>
**Status:** new | recurring (ref: <prior-id>)

**What's wrong**
<2-4 sentences explaining the bug in Thomas's terms. No jargon dumps.>

**Where**
- `path/to/file.js:LINE` — <what's on that line>
- (one bullet per relevant location)

**Repro / evidence**
<Either exact repro steps, or a code excerpt showing the defect. Keep code blocks under 20 lines.>

**Suggested fix**
<One paragraph. Point to the exact change, not a redesign.>
```

### `## Notes`
Optional. One or two sentences about what you explored, what you ruled out, or what you'd like to look at next time. Keep under 100 words.

## Short-id format
`YYYYMMDD-NN` where `NN` is a zero-padded 2-digit sequence starting at `01` for the day's first finding.

## Rules
1. H1, `## Summary`, `## Findings` are mandatory in that order.
2. Severity label in the H3 must match the `**Severity:**` line.
3. Code blocks use fenced triple-backticks with a language tag when applicable.
4. Redact any secret you find: `sk-ant-api03-REDACTED`.
5. Never link to internal paths outside the repo.
