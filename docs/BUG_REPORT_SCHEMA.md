# Bug Report Schema

Daily reports are written to `agent/reports/YYYY-MM-DD.md` and parsed by `run.py` for email delivery. Strict format — do not deviate.

## File header

```markdown
# Telos Bug Hunter Report - YYYY-MM-DD

**Focus**: <Functional | Visual/UX | Performance | Security>
**Bugs found**: <integer>
**Summary**: <one-sentence overview>
```

## Bug entries

Each bug is a level-2 heading using a stable bug ID:

```markdown
## BUG-YYYYMMDD-NN: <short title>

- **Severity**: <P0 | P1 | P2 | P3>
- **Area**: <subsystem, e.g. "client-dashboard", "api/cron", "index.html", "images">
- **File(s)**: `<path>:<line>` (one per line; use `multiple` if widespread)
- **Status**: new

### What's wrong
<2-4 sentences describing the bug. Be specific.>

### How to reproduce
<Exact steps OR specific code path. Numbered list preferred.>

### Impact
<Who is affected and how. Quantify when possible.>

### Suggested fix
<One paragraph or short code sketch. Optional but encouraged.>
```

## Bug ID format

`BUG-YYYYMMDD-NN` where NN is a zero-padded two-digit counter starting at 01 for that day's report.

## Zero-bug reports

If no bugs are found, omit all `## BUG-` sections and include a single `## Notes` section describing what was inspected and why no issues were flagged. Set `Bugs found: 0` in the header.

## Footer (optional)

```markdown
---

## Inspected this run
- <bullet list of files / endpoints / pages reviewed>

## Not inspected
- <bullet list of areas explicitly left out of scope>
```
