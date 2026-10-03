# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this layout. The orchestrator parses it.

## Required front-matter (YAML)

```yaml
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
bugs_found: <integer>
---
```

## Required sections

### 1. `# Summary`
One paragraph. Honest. If zero bugs, say so.

### 2. `# Bugs`
For each bug, a `## BUG-YYYY-MM-DD-NN - <short title>` section with:

- **Severity**: `P0` | `P1` | `P2` | `P3`
- **Area**: file path or area (e.g. `api/dashboard/clients.js`)
- **What's wrong**: plain English, one or two sentences
- **Repro / Evidence**: exact lines, exact steps, or an exact command
- **Impact**: who is affected and how
- **Suggested fix**: concise - a sentence or short code sketch

Omit the section entirely when there are zero bugs. The front-matter `bugs_found: 0` plus a summary is sufficient.

### 3. `# Scope checked`
Short bullet list of what you actually looked at. Transparency.

### 4. `# Notes for next run`
Optional. Any threads worth pulling later.
