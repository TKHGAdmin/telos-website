# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this schema. The email parser depends on it.

## File name
`agent/reports/YYYY-MM-DD.md` (ISO date, UTC).

## Required sections (in order)

### 1. YAML front matter
```
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
bug_count: <integer>
p0_count: <integer>
p1_count: <integer>
p2_count: <integer>
p3_count: <integer>
---
```

### 2. `# Telos Bug Report YYYY-MM-DD`
Level-1 heading with the ISO date.

### 3. `## Summary`
2-4 sentences. What was inspected, headline finding or "no bugs found." No padding.

### 4. `## Findings`
Zero or more findings. If zero, write exactly: `No bugs found today.`

Each finding is a level-3 heading with the format:

```
### [P<n>] <bug-id> - <one-line title>

- **File:** `<path>:<line>` (or `<path>` if the whole file is affected)
- **Severity:** P0 | P1 | P2 | P3
- **Category:** functional | visual | performance | security | accessibility
- **Reproduction:** <exact steps or inputs -> observed wrong outcome>
- **Suggested fix:** <one-sentence proposal, not code>
- **Confidence:** high | medium
```

`<bug-id>` is the run date + numeric index, e.g. `2026-09-20-01`.

Optional under the finding: a single fenced code block (max 20 lines) quoting the exact defective code, if useful for review.

### 5. `## Notes`
Optional. One paragraph on process (files inspected, tools used, what was ruled out). No padding.

## Rules

- No em dashes anywhere in the report.
- No emojis in the report.
- Keep each finding under 200 words including its code block.
- Never invent line numbers - if unsure, cite the file only.
- Never re-report a bug already in an approved or denied state in `decisions.jsonl`, or already reported in the last 14 days of reports.
- If a previously reported bug is still unresolved and worth re-surfacing, reference its original bug id in the summary rather than filing a new one.
