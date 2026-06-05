# Bug Report Schema

This file defines the contract between the Telos Bug Hunter agent and the
report parser/email pipeline. Reports that violate this schema will fail to
parse.

## File location

`agent/reports/YYYY-MM-DD.md` (one file per run, ISO date, UTC).

## Top-level structure

```
---
date: YYYY-MM-DD
focus: <one of: Functional | Visual/UX | Performance | Security>
bug_count: <integer>
status: <one of: bugs_found | zero_bugs>
agent_version: 1
---

# Telos Bug Hunter Report — <YYYY-MM-DD>

**Focus:** <focus area>
**Bugs found:** <integer>

<short paragraph summarising the run — what was inspected, headline finding>

## Bugs

### <BUG-ID> — <P0|P1|P2|P3> — <title>

**Where:** `<path/to/file.ext>:<line>` (additional locations OK)
**Repro:** <how to trigger / observe the bug>
**Why it matters:** <user/dev impact>
**Suggested fix:** <one-sentence direction, no code dumps>

---
```

## Field rules

- **date** — ISO `YYYY-MM-DD`, must match filename.
- **focus** — exactly one of the four allowed strings; matches the rotation
  for the day.
- **bug_count** — integer, must equal the number of `### BUG-` headings.
- **status** — `zero_bugs` when `bug_count == 0`, else `bugs_found`.
- **agent_version** — bump when the schema changes (currently `1`).

## Bug ID format

`BUG-YYYYMMDD-NN` where `NN` is a zero-padded two-digit sequence within the
day, starting at `01`. IDs are stable forever — once issued they are
referenced in `agent/memory/decisions.jsonl` and in future reports for
"still unresolved" callouts.

## Severity

| Level | Bar |
|---|---|
| **P0** | Breaks core functionality or exposes user data |
| **P1** | Degrades experience for many users |
| **P2** | Affects some users or edge cases |
| **P3** | Minor polish / tech debt |

## Zero-bug days

When no qualifying bugs are found, the file MUST still exist with:

- `bug_count: 0`
- `status: zero_bugs`
- A `## Bugs` section containing the single line `_No qualifying issues
  found today._`

A zero-bug report is valid output. Do not pad.

## What NOT to include

- Stylistic preferences ("I'd refactor this")
- Speculative bugs ("could be exploited if...")
- Duplicates of any bug in the last 14 days of reports
- Items already marked `denied` or `fixed` in `decisions.jsonl`
