# Bug Report Schema

This document defines the contract for daily bug reports produced by the Telos Bug Hunter agent. The orchestrator's email parser depends on this exact structure. Do not deviate.

## File location

`agent/reports/YYYY-MM-DD.md` (one file per run, ISO date in filename).

## Required front-matter block

Every report must begin with a YAML-style front-matter block delimited by `---` lines:

```
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
bugs_found: <integer >= 0>
agent_version: 1
---
```

## Required sections

Every report has exactly these top-level headings in this order:

### `# Telos Bug Hunter — Daily Report`

Title line. Always identical.

### `## Summary`

One paragraph (under 100 words). Plain-English description of what was checked, what was found, and a one-sentence verdict. If zero bugs, say so explicitly.

### `## Bugs`

Zero or more bug entries. If zero bugs, write a single line: `_No bugs found in this focus area today._`

Each bug entry is a subsection with this exact structure:

```
### BUG-YYYYMMDD-NN — <one-line title>

- **Severity**: P0 | P1 | P2 | P3
- **Area**: <single short tag, e.g. "shop", "client-dashboard", "blog">
- **File(s)**: `<path>:<line>` (one per line, bullet sub-list if multiple)
- **Status**: new | recurring

**What's wrong**
<2-5 sentences describing the bug clearly. State the actual incorrect behavior, not the cause.>

**Reproduction**
<Numbered steps OR a code-trace pointing to exact lines. Must be concrete enough for Thomas to verify in under 2 minutes.>

**Impact**
<1-2 sentences. Who is affected and how.>

**Suggested fix**
<1-3 sentences OR a small code snippet. Optional but recommended.>
```

### `## Process notes`

Optional. Any meta-observations about the run itself (tools that failed, areas you couldn't access, time constraints). Skip the section entirely if there's nothing to say — do not write `_None._`.

## Bug ID format

`BUG-YYYYMMDD-NN` where `NN` is a two-digit zero-padded counter, starting at `01` per day. Example: `BUG-20260522-01`.

## Severity definitions

| Severity | Definition |
|---|---|
| P0 | Breaks core functionality or exposes user data |
| P1 | Degrades experience for many users |
| P2 | Affects some users or edge cases |
| P3 | Minor polish or tech debt |

## Hard constraints

- Markdown only. No HTML.
- No emojis anywhere in the report.
- No em dashes (`—` is the typographic em dash and is allowed; `---` is the YAML delimiter and is reserved).
- Bug count in the front-matter must match the number of `### BUG-` entries.
- A zero-bug report is valid. Do not invent bugs to fill the report.
