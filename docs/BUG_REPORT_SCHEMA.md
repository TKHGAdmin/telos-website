# Bug Report Schema

Every daily report written by the Telos Bug Hunter agent must follow this exact structure so the email parser can extract, rank, and present findings for Thomas.

## File location

`agent/reports/YYYY-MM-DD.md` — one file per run, named for the run date in UTC.

## Frontmatter

Every report starts with a YAML frontmatter block:

```yaml
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bug_count: <integer>
p0_count: <integer>
p1_count: <integer>
p2_count: <integer>
p3_count: <integer>
run_status: ok | bootstrap | error
---
```

- `bug_count` is the total number of findings in the report.
- `p*_count` fields must sum to `bug_count`.
- `run_status: bootstrap` on the very first run (infrastructure was created this run).
- `run_status: error` if the agent could not complete its normal routine and is reporting a failure state.

## Body

### Summary section

A single `## Summary` heading followed by 1-3 sentences of plain prose describing the run at a glance. If zero bugs, say so plainly.

### Findings

Each finding is a `### [P0|P1|P2|P3] <short title>` heading followed by these labeled subsections in this exact order:

```
**Severity**: P0 | P1 | P2 | P3
**Category**: functional | visual-ux | performance | security
**File**: <repo-relative path>:<line>
**Reproduction**: <how to observe the bug — code trace or steps>
**Impact**: <who is affected and how>
**Fix**: <suggested one-line remedy>
**Confidence**: high | medium
```

- `File` must be a real repo-relative path with a line number the parser can jump to.
- `Confidence` must be `high` for anything reported; `medium` is for edge cases where the agent has done its best to verify but wants Thomas to double-check before acting.
- Never include `low` confidence findings — the triage gate in `agent/AGENT.md` rejects them.

### Zero-bug reports

If the hunt finds nothing, the report body is just the `## Summary` section explaining what was searched. No findings section. `bug_count: 0` in frontmatter.

### Notes (optional)

An optional `## Notes` section at the end may contain observations too speculative to be findings — patterns, questions for Thomas, or areas the agent wants to explore next time. The parser ignores this section.

## Hard rules

1. Frontmatter YAML must be valid — the parser fails closed on malformed YAML.
2. Field names in findings are case-sensitive: `**Severity**`, not `**severity**`.
3. One finding per heading. Never merge multiple issues under one heading.
4. Line numbers must match the current commit at run time.
5. Never invent findings to pad the report.
