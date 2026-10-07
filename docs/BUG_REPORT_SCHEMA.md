# Bug Report Schema

The Telos Bug Hunter writes one Markdown file per run at `agent/reports/YYYY-MM-DD.md`. The `run.py` orchestrator parses this file to send the daily email, so the structure below is a strict contract.

## File layout

```
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
bug_count: <integer>
---

# Telos Bug Hunter — YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Scope:** Telos Fitness web platform (telosathleticclub.com)
**Bugs found:** <N>

## Summary

<One short paragraph: what you looked at, headline count by severity, whether anything is urgent.>

## Findings

### <N>. [<Pxx>] <Short title>

- **ID:** `YYYY-MM-DD-<N>`
- **Severity:** P0 | P1 | P2 | P3
- **Area:** <admin | client-portal | public-site | api | infra | ...>
- **File(s):** `path/to/file.js:LINE`
- **Reproduction:**
  1. Step one
  2. Step two
  3. Expected: <what should happen>
  4. Actual: <what does happen>
- **Impact:** <who it affects and how>
- **Suggested fix:** <specific change, with code snippet if helpful>

<Repeat the Findings block for each bug. If zero bugs, omit the Findings section entirely and say so in the Summary.>

## Not reported this run

<Optional. Short bullets of things you investigated and ruled out, so the pattern isn't re-hunted next time. Keep to 3-5 items max.>
```

## Rules the parser depends on

1. **The YAML front-matter block MUST be the first thing in the file**, delimited by `---` lines. `date`, `focus`, and `bug_count` are required keys.
2. **Each finding MUST start with `### <N>. [<Pxx>] <title>`** — the number, the severity in brackets, and the title on the same line.
3. **Each finding MUST include `ID`, `Severity`, `Area`, `File(s)`, `Reproduction`, `Impact`, and `Suggested fix`** as bold-labeled list items in that order.
4. **ID format: `YYYY-MM-DD-<N>`** where N starts at 1 and increments per finding in the file. This is the key the approve/deny decisions use.
5. **Severity is one of `P0`, `P1`, `P2`, `P3`.** No others.
6. **If zero bugs, `bug_count: 0`** in the front-matter and no `## Findings` section at all. Still include the Summary.

## Severity reference

| Level | Definition |
|---|---|
| P0 | Breaks core functionality or exposes user data |
| P1 | Degrades experience for many users or an owner-critical workflow |
| P2 | Affects some users or edge cases; security gaps with limited blast radius |
| P3 | Minor polish / tech debt worth flagging |
