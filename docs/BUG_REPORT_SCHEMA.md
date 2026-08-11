# Bug Report Schema

This schema is the contract between the Telos Bug Hunter agent and the email
notification / triage pipeline. Reports live at
`agent/reports/YYYY-MM-DD.md`. Break the schema and the email won't send.

## File name

`agent/reports/YYYY-MM-DD.md` — the date the report was generated, in the
America/New_York calendar day.

## Structure

Every report has this exact top-level structure. Section headings must be
verbatim (case, punctuation, order):

```markdown
# Telos Bug Hunter Report — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Findings:** N
**Approval-eligible:** N   <!-- excludes duplicates and P3-only -->

## Summary

<1–3 sentences describing what was scanned and the headline result.>

## Findings

<Zero or more finding blocks. If zero, write literally:>

_No bugs found this run._

## Notes

<Optional. Anything the operator should know that isn't a finding: coverage
gaps, tools that didn't run, next-run intentions. Omit the section if empty.>
```

## Finding block

Each finding is an H3 with a stable id, followed by a fixed metadata block
and free-form body:

```markdown
### BUG-YYYYMMDD-NN — <one-line title, imperative or descriptive>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** functional | visual | performance | security | accessibility
- **Location:** `path/to/file.js:LINE` (or `path/to/file.js:START-END`)
- **Status:** new | recurring (BUG-YYYYMMDD-NN)
- **Confidence:** high | medium

**What's wrong**

<One or two sentences describing the defect.>

**How a user hits it**

<Concrete reproduction: URL, click path, input, or state that triggers it.>

**Suggested fix**

<One or two sentences. Point at the change, do not paste a full patch.>
```

### Id format

`BUG-YYYYMMDD-NN` where `YYYYMMDD` is the report date and `NN` is a
two-digit index starting at `01` within that report. Ids are permanent once
assigned; a recurring bug keeps its original id in the `Status:` line and
gets a new id in the `###` heading for this run.

### Severity ladder

| Severity | Definition |
|---|---|
| P0 | Breaks core functionality, exposes user data, or leaks a live secret. |
| P1 | Degrades experience for many users (broken form, mobile layout collapsed, slow checkout). |
| P2 | Affects some users or edge cases (Safari-only glitch, missing empty state, minor accessibility gap). |
| P3 | Minor polish or tech debt worth flagging (deprecated API, small perf win, typo). |

## Hard rules

1. **Every field in the metadata block is required.** No missing keys.
2. **Location must resolve.** File path is repo-relative; line numbers must
   correspond to the file at HEAD when the report was written.
3. **No fabricated bugs.** Zero findings is a valid, expected outcome. If
   the "Findings" section is empty, use the literal string
   `_No bugs found this run._`
4. **No recurring bug reported without cross-reference.** If the same defect
   was already reported in the last 14 days, the `Status:` line must name
   the prior id.
5. **No secrets in the report.** If the finding is a leaked secret, quote
   only enough to identify it and mask the rest (e.g.
   `sk-ant-api03-REDACTED`).
6. **No PII in the report.** Client emails, names, or portal contents from
   the running system must never appear.

## Zero-findings example

```markdown
# Telos Bug Hunter Report — 2026-08-11

**Focus:** Functional
**Findings:** 0
**Approval-eligible:** 0

## Summary

Traced the public quiz, email-capture, and Charleston application flows end
to end and audited the last two weeks of commits. Nothing new is broken.

## Findings

_No bugs found this run._
```
