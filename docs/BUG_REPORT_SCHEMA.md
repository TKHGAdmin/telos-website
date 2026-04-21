# Bug Report Schema

All daily reports must conform to this schema. The email parser depends on exact structure.

## File location
`agent/reports/YYYY-MM-DD.md`

## Required frontmatter

```yaml
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
bugs_found: <integer>
run_id: <YYYY-MM-DD>-<focus>
---
```

## Required sections

### 1. Summary
One or two sentences stating what was examined and the headline finding. If zero bugs: state that plainly.

### 2. Scope
Bullet list of files, endpoints, or pages inspected.

### 3. Findings
Zero or more bug entries. Each bug MUST use this structure:

```
#### BUG-YYYYMMDD-NN — <short title>
- **Severity:** P0 | P1 | P2 | P3
- **Location:** `<file>:<line>` or `<endpoint>` or `<page>`
- **Category:** auth | xss | csrf | idor | logic | layout | a11y | perf | dep | secret | other
- **Reproduce:** numbered steps or exact trace
- **Impact:** who is affected and how
- **Suggested fix:** 1-3 sentence direction (no patches unless trivial)
- **Confidence:** high | medium | low
```

BUG IDs are `BUG-<YYYYMMDD>-<NN>` with NN zero-padded starting at 01.

### 4. Not-bugs considered
Brief list of patterns examined and ruled out, so Thomas sees what was triaged. Keep to 1 line each.

### 5. Follow-ups
Open questions or areas to revisit on future runs. Optional.

## Rules
- No emojis.
- No em dashes (use `-`).
- Plain Markdown only; no HTML embeds.
- If `bugs_found: 0`, the Findings section must contain the single line: `None.`
