# Bug Report Schema

Each daily report lives at `agent/reports/YYYY-MM-DD.md` and follows this exact structure so the `run.py` orchestrator can parse it into an email.

## Header (YAML front matter)

```yaml
---
date: YYYY-MM-DD          # ISO date of the run
focus: functional         # one of: functional | visual | performance | security
run: N                    # nth run since inception (1, 2, ...)
findings: N               # count of bugs in this report (0 is valid)
---
```

## Body sections (in order)

### Summary

One paragraph, plain prose. What the agent looked at today and the headline result. If zero findings, say so and stop after this section.

### Findings

Zero or more bugs. One `###` heading per bug in this exact form:

```
### [Pn] Short title (kebab-case-id)
```

Where `Pn` is `P0`/`P1`/`P2`/`P3` and the id is a stable slug the agent will reuse if the bug persists across days.

Under each bug, these fields in order (any missing field means the parser drops the bug):

- **Severity:** `P0` | `P1` | `P2` | `P3`
- **Area:** short slug (e.g. `shop`, `client-dashboard`, `api`, `auth`, `landing`)
- **File(s):** repo-relative path with line numbers, `path/to/file.ext:line-line`
- **Reproduction:** numbered list, precise enough to reproduce without guessing
- **Failure:** what the user sees or what breaks
- **Root cause:** one paragraph, cite the exact code
- **Suggested fix:** one paragraph, no code diff required
- **Confidence:** `high` | `medium` (never report `low`; drop it instead)

### Notes

Freeform prose. Anything Thomas should know that isn't a bug: patterns observed, areas skipped and why, ideas for the next rotation. Skip this section entirely if there's nothing to add.

## Parser rules

- Front matter is required. Missing or malformed → email not sent.
- `findings` count in the front matter must equal the number of `### [Pn]` headings in the Findings section.
- Bug ids are stable slugs. If a bug persists into a later report, reuse the same id and note "still unresolved" in Reproduction.
- No HTML, no images, no attachments. Plain Markdown only.
