# Bug Report Schema

The Telos Bug Hunter writes one Markdown file per day at `agent/reports/YYYY-MM-DD.md`. This is the contract the report parser depends on. Do not deviate.

## File name

`agent/reports/YYYY-MM-DD.md` (UTC date).

## Front matter (YAML)

Every report starts with a YAML front matter block, delimited by `---`:

```yaml
---
date: 2026-07-20
focus: functional        # one of: functional, visual, performance, security
bug_count: 3             # integer; 0 is valid
run_status: ok           # one of: ok, error, skipped
---
```

- `run_status: error` means the agent hit a blocker and could not complete a full pass. Include a `notes` field explaining what failed.
- `run_status: skipped` means the agent intentionally produced no findings (e.g. quiet day, no repo changes to review).

## Body sections

The body must contain, in this order:

### 1. `## Summary`

One paragraph. Two-to-four sentences. What was hunted, what was found at a glance.

If `bug_count` is 0: say so plainly. Example — "Focused on functional bugs across API endpoints and client flows. No new issues found today. Two known items from previous reports remain unresolved (see below)."

### 2. `## Bugs` (omit if `bug_count` is 0)

One `###` heading per bug, in severity order (P0 first). Each bug is a fixed block:

```markdown
### BUG-YYYY-MM-DD-N — [one-line title]

- **Severity:** P0 | P1 | P2 | P3
- **File(s):** `path/to/file.js:LINE` (comma-separated if multiple)
- **Category:** functional | visual | performance | security
- **Reproduction:** How to reproduce or trigger the bug. Concrete steps or the exact code path.
- **Impact:** Who is affected and how bad it is in practice.
- **Suggested fix:** One paragraph describing the recommended change. Do not paste patches.
- **Confidence:** high | medium
```

`BUG-YYYY-MM-DD-N` is a stable id — the date plus a 1-indexed counter within the day. Referenced later in `decisions.jsonl`.

`Confidence: high` = you traced the exact failure path. `Confidence: medium` = strong suspicion but couldn't fully verify. Do not report `low` confidence bugs — filter them out at the triage step.

### 3. `## Unresolved from previous reports` (optional)

If any bug from the last 14 days is still present in the code and has been approved-but-not-fixed, list its id and one sentence: "`BUG-2026-07-13-2` — still present in main." Do not re-describe the bug; the id is enough for lookup.

### 4. `## Notes` (optional)

Anything worth flagging that isn't a bug: patterns noticed, areas skipped and why, tools that failed to run, environment observations. Keep it under 200 words.

## Hard rules

- Front matter fields are required and typed as shown. The parser will reject a report with missing or malformed fields.
- Bug ids must be unique and monotonic within the day.
- Never invent a file path or line number. If you can't cite the exact location, don't include the bug.
- Never paste secrets, tokens, or PII into the report. If you discover a secret, redact it (e.g. `sk-XXXX-REDACTED`) and mark the bug P0.
