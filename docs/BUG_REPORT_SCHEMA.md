# Bug Report Schema

Every daily report emitted by the Telos Bug Hunter agent must follow this schema. The `run.py` orchestrator parses these files to build the summary email — deviations break the pipeline.

## File location & name

`agent/reports/YYYY-MM-DD.md` (one file per run, UTC date)

## Front matter (required)

Each report begins with a YAML front-matter block:

```yaml
---
date: 2026-07-28          # ISO date
focus: visual-ux          # one of: functional | visual-ux | performance | security
run_type: scheduled       # scheduled | manual | bootstrap
bugs_found: 3             # integer, total count across all severities
severity_counts:
  P0: 0
  P1: 0
  P2: 2
  P3: 1
---
```

## Body sections (in order)

1. `# Telos Bug Hunter - YYYY-MM-DD`
2. `## Summary` - one paragraph, plain English, tells Thomas whether to open the report.
3. `## Findings` - zero or more bug entries. If zero, write `_No new bugs surfaced today._`
4. `## Notes` - optional. Coverage gaps, environmental issues, or context for the next run.

## Finding entry format

Each finding is its own subsection:

```markdown
### BUG-YYYYMMDD-NN - <short title> [Pn]

- **File(s):** relative/path.ext:line, other/file.ext
- **First seen:** YYYY-MM-DD (this run if new)
- **Recurring?:** no  # or "yes, previously BUG-YYYYMMDD-NN"

**What's wrong**
2-4 sentence description. Concrete, testable claim. No hedging.

**Repro / evidence**
Either steps to reproduce OR a code excerpt with line numbers OR a screenshot description. Something Thomas can verify in under 60 seconds.

**Suggested fix**
One paragraph. Not a full implementation - just the direction.

**Approve / Deny**
- [ ] Approve  (append to agent/memory/decisions.jsonl as {id, decision: "approve"})
- [ ] Deny     (append to agent/memory/decisions.jsonl as {id, decision: "deny", reason: "..."})
```

## ID format

`BUG-YYYYMMDD-NN` where NN is a 2-digit zero-padded sequence within that day's report (01, 02, ...).

## Severity definitions

| Code | Meaning |
|---|---|
| P0 | Breaks core functionality or exposes user data. Fix today. |
| P1 | Degrades experience for many users. Fix this week. |
| P2 | Affects some users / edge cases. Fix when convenient. |
| P3 | Minor polish or tech debt. Batch with related work. |

## Hard rules

- No fabricated bugs. Zero-finding reports are valid.
- Never re-report a bug that appears in the last 14 days of reports as "fixed" or "denied" without new evidence.
- No secrets in the report body. Redact as `sk-ant-api03-REDACTED`.
- The report must parse as valid Markdown. No stray backticks, unmatched fences, or broken YAML.
