# Bug Report Schema

Every daily report file at `agent/reports/YYYY-MM-DD.md` MUST conform to this schema. The report has YAML frontmatter followed by Markdown findings.

## Frontmatter (required)

```yaml
---
date: YYYY-MM-DD              # Report date, UTC
focus: functional|visual|performance|security
findings_count: <int>
agent_version: 1
---
```

## Body

### If zero findings

A single paragraph stating no bugs were found and what areas were covered. Nothing else.

### If one or more findings

For each finding, a level-2 heading:

```markdown
## {id}: {short title}

- **Severity**: P0 | P1 | P2 | P3
- **File**: `path/to/file.js:LINE`
- **Status**: new

### What's wrong
One paragraph. Describe the defect clearly.

### Reproduction
Numbered steps or a code trace. Must be concrete.

### Suggested fix
One short paragraph (optional code block). Not a mandate — just a starting point.
```

## Rules

- `id` format: `BUG-YYYYMMDD-N` where N is a 1-indexed integer per report.
- `Severity` strict: P0 (data/function broken), P1 (many users affected), P2 (edge case), P3 (polish/debt).
- `Status` is always `new` when the agent writes the report. The reviewer flips it to `approved`, `denied`, or `fixed` out-of-band in `agent/memory/decisions.jsonl`.
- Keep each finding under ~200 lines of markdown. If you need more, you're probably reporting a design doc, not a bug.
- No marketing language. No emojis.
