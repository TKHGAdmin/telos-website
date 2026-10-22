# Bug Report Schema

Each daily report is a single Markdown file written to `agent/reports/YYYY-MM-DD.md`. The orchestrator parses it; keep the structure stable.

## Required front-matter block

```yaml
---
date: YYYY-MM-DD
focus: Functional | Visual/UX | Performance | Security
bug_count: <integer>
agent: terminex-bug-detector
---
```

## Required sections

### `## Summary`

One paragraph: what was reviewed today, what was found, overall health signal.

### `## Findings`

Zero or more findings. Each finding uses this exact structure:

```markdown
### BUG-YYYYMMDD-NN — <short title>

- **Severity**: P0 | P1 | P2 | P3
- **Category**: Functional | Visual/UX | Performance | Security
- **File(s)**: `path/to/file.js:L123`
- **Reproduce**: Exact steps or trace.
- **Impact**: What breaks for whom.
- **Suggested fix**: One-sentence pointer, no diff required.
```

Bug IDs: `BUG-<ISO date with no hyphens>-<two-digit index>`, e.g. `BUG-20261022-01`.

### `## Methodology`

Short bulleted list of what tools / files / endpoints you checked. Lets Thomas verify scope.

### `## Open questions`

Optional. Anything you want human judgement on.

## Zero-finding reports

If no bugs cleared the triage gate, keep all sections, set `bug_count: 0`, and in `## Findings` write a single line: `No findings today.`

## Hard rules

- No bugs invented to pad the report.
- No duplicates of findings from the prior 14 days.
- Severity reflects user impact, not how much Thomas will care.
- Redact any secret you discover (`sk-...REDACTED`) and mark it P0.
