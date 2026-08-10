# Bug Report Schema

Every daily report produced by the Telos Bug Hunter agent MUST follow this schema exactly. The email/parse layer downstream depends on it.

## File location

`agent/reports/YYYY-MM-DD.md` (one report per day, dated in UTC).

## Front-matter (YAML)

Every report starts with a YAML front-matter block:

```yaml
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bugs_found: <integer>
p0: <integer>
p1: <integer>
p2: <integer>
p3: <integer>
---
```

`bugs_found` must equal `p0 + p1 + p2 + p3`.

## Body sections

Following the front-matter, the body MUST have these sections in this order:

### 1. Summary

One paragraph (2-5 sentences). Plain prose. What was hunted, what was found (or that nothing was found), any headline signal Thomas should know before scrolling.

### 2. Findings

Zero or more findings. Each finding is an H3 with this exact structure:

```
### [Pn] <one-line title>

- **File:** `path/to/file.ext:LINE` (or `path/to/file.ext:LINE-LINE`)
- **Category:** functional | visual-ux | performance | security
- **Confidence:** high | medium

**What's wrong:** One or two sentences stating the defect.

**Reproduction:** Concrete steps or the exact code path that triggers the bug. Not "could theoretically" - either "does this" or omit.

**Suggested fix:** One or two sentences. Not a full diff. Enough for Thomas to skim and approve.

**ID:** BUG-YYYY-MM-DD-NN
```

`Pn` is one of `P0` / `P1` / `P2` / `P3`.

`ID` uses the report date + a two-digit sequence, starting at `01`. IDs are permanent - referenced by `decisions.jsonl` and future dedup checks.

### 3. Notes

Optional. Anything that was looked at but rejected (with a one-line reason), or areas skipped and why, or recurrences of previously-reported bugs (with prior BUG ID reference and "still unresolved").

If nothing to note, omit the section.

## Zero-bug reports

If no findings survive triage, the Findings section is a single line:

```
_No new bugs found today._
```

The front-matter still reports `bugs_found: 0` and all Pn counts `0`. This is a valid, honest report - do not pad.

## Hard rules

- No em dashes anywhere (project convention: use `-`).
- No emojis.
- File paths are repo-relative and use forward slashes.
- Never invent a line number - if you're not sure, use a range.
- Never repeat a BUG ID across reports.
