# Bug Report Schema

Daily reports live at `agent/reports/YYYY-MM-DD.md` and follow this layout exactly. The orchestrator parses it; deviations break the email.

## Frontmatter (required)

```
---
date: YYYY-MM-DD
focus: Functional | Visual/UX | Performance | Security
bug_count: <integer>
run_status: ok | blocked
---
```

## Body sections (in order)

### `# Telos Bug Hunter Report - YYYY-MM-DD`

One-line top header.

### `## Summary`

One or two plain sentences. State the focus, the bug count, and (if non-zero) a one-line summary of the highest-severity item. If zero bugs, say so plainly.

### `## Bugs`

If `bug_count == 0`, write `No bugs reported.` and skip the rest of this section.

Otherwise, one `### Bug <N>: <short title>` heading per bug, ordered by severity (P0 first). Each bug has these required fields:

```
### Bug N: <short title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <subsystem or file path>
- **File:** <path>:<line> (or `multiple` with paths listed in Details)
- **Status:** new | recurring (prior: YYYY-MM-DD)

**What's wrong**
<1-3 sentence description>

**Why it matters**
<1-2 sentences on user/developer impact>

**Repro / evidence**
<concrete steps, code excerpt, or pointer to lines>

**Suggested fix**
<short proposed change - not code, just the direction>
```

### `## Notes`

Free-form. Areas explored, patterns spotted, false-positive avoidance. Keep brief.

### `## Tomorrow's focus`

One line: `Tomorrow: <Functional | Visual/UX | Performance | Security>`

## Hard rules

- Frontmatter fields are exact. No extras, no missing.
- Severity values are exactly `P0`/`P1`/`P2`/`P3`.
- Focus values are exactly the four listed.
- `bug_count` matches the number of `### Bug N:` headings.
- Markdown only. No HTML, no images, no embedded JSON.
