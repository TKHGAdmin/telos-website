# Bug Report Schema

This is the contract between the Bug Hunter agent and the orchestrator / email sender. The parser depends on this layout. Do not deviate.

## File location

`agent/reports/YYYY-MM-DD.md` — one file per run, named by run date in UTC.

## Required front-matter

Every report begins with a YAML front-matter block:

```yaml
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
total_findings: <integer>
run_duration_min: <integer, optional>
---
```

## Body sections

### 1. Summary (required)

A single `## Summary` section with one short paragraph. State the focus area, the number of findings by severity, and whether this run turned up anything that needs immediate attention. A zero-finding run says so plainly here and omits the Findings section.

### 2. Findings (required when `total_findings > 0`)

A single `## Findings` section containing one `### Finding N` subsection per bug, numbered from 1. Each subsection MUST have the following labeled fields, each on its own line, in this order:

```
### Finding N - <short title, under 70 chars>

- **ID**: BUG-YYYY-MM-DD-NN       (e.g. BUG-2026-11-04-01)
- **Severity**: P0 | P1 | P2 | P3
- **Category**: functional | visual | performance | security
- **File(s)**: comma-separated repo-relative paths with optional :line suffix
- **Status**: new | recurring

**What's wrong**
<1-3 sentences describing the defect.>

**Reproduce**
<Numbered steps, or code trace with exact lines. Must be concrete enough that a developer can confirm without guessing.>

**Impact**
<Who it affects and how. One sentence.>

**Suggested fix**
<One sentence, non-prescriptive. Say what to change, not how to refactor.>
```

If a bug recurs from a prior report, set `Status: recurring` and add a line `- **Prior report**: YYYY-MM-DD` referencing the earliest occurrence.

### 3. Notes (optional)

A `## Notes` section for observations that are NOT bugs but matter for future runs — e.g., areas explored, false-positive patterns encountered, context for the next hunter. Keep it short.

## Hard rules

- **No bugs** → omit the `## Findings` section entirely. The `## Summary` section alone is the whole report.
- **Finding titles** are a short label, not a sentence. "Quiz gate bypassable with empty inputs" — not "I found that the quiz gate…".
- **Secrets**: If a finding exposes a secret, redact it inline (e.g. `sk-ant-REDACTED`) and set severity to P0.
- **No speculation**: Every finding must be reproducible from the Reproduce block alone. If you can't reproduce it, don't include it.
- **No padding**: Zero findings is a valid report. Do not invent issues to pad the list.

## Severity rubric

| Severity | Definition |
|---|---|
| P0 | Breaks core functionality or exposes user data |
| P1 | Degrades experience for many users; business-critical flow affected |
| P2 | Affects some users or edge cases |
| P3 | Minor polish, tech debt, style inconsistency worth flagging |
