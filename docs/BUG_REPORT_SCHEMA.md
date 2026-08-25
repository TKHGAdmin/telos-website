# Bug Report Schema

Every daily bug report at `agent/reports/YYYY-MM-DD.md` must follow this schema. The `run.py` orchestrator parses these files; deviating breaks the pipeline.

## Required frontmatter

Every report starts with a YAML frontmatter block:

```
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
bugs_found: <integer>
---
```

## Report body

### Zero-bug case

If no bugs found, the body is a single line:

```
No bugs found today. Focus was <focus>.
```

Optionally followed by a one-paragraph note on what was checked.

### One-or-more-bugs case

For each bug, a single H2 block using this exact structure:

```
## BUG-YYYY-MM-DD-N — <one-line title>

- **Severity**: P0 | P1 | P2 | P3
- **Focus**: functional | visual | performance | security
- **Files**: `path/one.js:LINE`, `path/two.js:LINE-LINE`
- **Status**: new | recurring (references BUG-YYYY-MM-DD-N)

### What's wrong
<1-3 sentences on the defect>

### How to reproduce
<Numbered steps or code path trace so Thomas can verify>

### Suggested fix
<Brief recommended patch — pseudocode or 1-2 lines of real code>
```

## ID rules

- `BUG-YYYY-MM-DD-N` where N is 1-indexed per day.
- IDs must be unique across all reports. If the same bug is re-flagged, reuse the original ID and set `Status: recurring (references BUG-original-id)`.

## Do not include

- Style preferences
- "Could be cleaner" refactor suggestions
- Bugs already marked approved/denied in `agent/memory/decisions.jsonl` within the last 14 days
- Fabricated or theoretical issues without a reproducible path
