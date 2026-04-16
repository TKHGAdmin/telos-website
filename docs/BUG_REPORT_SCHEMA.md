# Bug Report Schema

Every daily report produced by the Telos Bug Hunter must follow this exact structure. The orchestrator parses these files to build emails and decision records.

## File location

`agent/reports/YYYY-MM-DD.md` (one file per run, ISO date, UTC).

## Required frontmatter

```yaml
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
bugs_found: <integer>
---
```

## Body structure

### 1. Summary (required)

A single paragraph (1-4 sentences) describing today's focus area and high-level outcome. If zero bugs were found, say so plainly here.

### 2. Bugs (zero or more)

Each bug is a level-2 heading in the form:

```
## BUG-YYYYMMDD-NN - <short title>
```

Where `NN` is a zero-padded sequence number (01, 02, ...) within the day.

Each bug MUST contain the following fields in this order:

- **Severity**: P0 | P1 | P2 | P3
- **Area**: free-text area/component (e.g., "client-dashboard", "api/submit-quiz", "pricing.html")
- **File(s)**: absolute or repo-relative file paths, one per line
- **Description**: 1-3 sentences explaining what is wrong and why it matters
- **Reproduction**: numbered steps OR a code snippet pointing to the exact lines
- **Expected**: what should happen
- **Actual**: what actually happens
- **Suggested fix**: 1-2 sentences (optional but encouraged)

### 3. Notes (optional)

Free-form footer for context, caveats, or things the agent wants to flag but is not confident enough to file as bugs.

## Rules

1. IDs must be globally unique. Use the date + sequence so two runs never collide.
2. Severities must be one of P0/P1/P2/P3 exactly.
3. Every bug must cite at least one file path.
4. Zero-bug days are valid. The file still exists with `bugs_found: 0` and a Summary section.
5. No emojis in reports.
6. No fabricated findings. If confidence is low, use the Notes section instead.
