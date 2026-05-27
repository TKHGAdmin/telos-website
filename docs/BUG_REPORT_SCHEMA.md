# Bug Report Schema

Every report in `agent/reports/YYYY-MM-DD.md` MUST follow this structure. The orchestrator parses it to build the daily email; if you break the schema the email won't send.

## File-level frontmatter

```
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
findings_count: N
zero_findings: true | false
---
```

## Body (when findings_count > 0)

A short summary paragraph (1-3 sentences), then one block per finding in **descending severity** (P0 first):

```
## Finding {N}: {short title}

- **id**: {YYYY-MM-DD}-{N}
- **severity**: P0 | P1 | P2 | P3
- **confidence**: high | medium | low
- **file**: path/to/file.ext:line[-line]
- **status**: new | recurring (from {prior YYYY-MM-DD}-{N})

### What

1-3 sentences describing the bug.

### Reproduction / Evidence

Concrete steps OR code-trace evidence with line refs.

### Suggested fix

1-2 sentences. Code snippet optional.
```

## Body (when findings_count = 0)

A 2-3 sentence summary of what was checked and why nothing surfaced. No padding, no fake findings.

## Hard rules

- Only `confidence: high` findings are included. Lower-confidence candidates stay in `learnings.md` notes.
- Severity definitions in the agent system prompt are authoritative.
- Findings must be unique vs. the last 14 days of reports AND vs. items already documented as known in `CLAUDE.md`'s backlog.
