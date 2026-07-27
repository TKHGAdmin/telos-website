# Bug Report Schema

Format for daily bug hunter reports at `agent/reports/YYYY-MM-DD.md`.

## Frontmatter

```
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bugs_found: <integer>
run_status: ok | zero-findings | error
---
```

## Sections

### `# Summary`
One paragraph. What was inspected, headline result.

### `# Findings`
Empty section header if zero bugs. Otherwise one `## Bug N — P<0-3> — <title>`
per bug, in severity-descending order.

Each bug MUST contain:

- **Severity**: P0 / P1 / P2 / P3
- **Area**: e.g. `shop.html`, `api/dashboard/clients.js`, `client-dashboard.html`
- **Repro**: Numbered steps or a code-trace pointing to `file:line`
- **Impact**: One sentence — who is affected, what breaks
- **Suggested fix**: One paragraph, non-prescriptive

Bug IDs are the report date + index, e.g. `2026-07-27-1`.

### `# Not Bugs (Investigated)`
Optional. Things that looked suspicious but were verified as intentional or
already-known. One line each.

### `# Next-Run Notes`
Optional. What today's focus surfaced that tomorrow's focus should chase.

## Parser rules

- Frontmatter is YAML-ish key: value pairs between `---` delimiters.
- Bug sections are recognised by the `## Bug N — P<0-3>` heading pattern.
- Fields inside a bug section are recognised by `**Field**:` prefix.
- Missing/extra fields fail the parse — do not deviate.
