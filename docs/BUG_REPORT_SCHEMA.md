# Bug Report Schema

This file defines the exact structure of daily bug reports produced by the Telos Bug Hunter agent. Reports are stored at `agent/reports/YYYY-MM-DD.md` and consumed downstream by the email dispatcher and by future agent runs (for dedupe / learning). Deviating from this schema breaks the parser.

## File location

`agent/reports/YYYY-MM-DD.md` — one file per run, named by UTC date.

## Structure

Reports are Markdown with a small YAML-style front-matter block for metadata that the parser reads. The body is free-form Markdown grouped by bug ID.

### Front matter (required)

```
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
bugs_found: <integer>
run_status: ok | partial | failed
---
```

- `date`: UTC date of the run, matching the filename.
- `focus`: the rotation slot used for this run.
- `bugs_found`: total unique bugs reported (0 is valid).
- `run_status`:
  - `ok` — clean run.
  - `partial` — some tools failed but findings are still valid.
  - `failed` — the agent could not complete the routine (report bugs = 0 and put the reason in Summary).

### Summary (required, 1-3 sentences)

`## Summary`

One paragraph. Plain English. What was checked, what was found, what needs Thomas's attention today. If zero bugs, say so plainly — do not pad.

### Bugs (0 or more)

Each bug is its own `### BUG-<YYYYMMDD>-<NN>` heading, where `NN` is a zero-padded ordinal starting at 01. IDs must be globally unique across all reports.

```
### BUG-YYYYMMDD-NN
- **Severity**: P0 | P1 | P2 | P3
- **Area**: <short label — e.g. "checkout", "client-dashboard", "api/dashboard/clients", "sw.js">
- **Files**: `path/to/file.ext:line` (comma-separated when more than one)
- **Summary**: One-sentence description of the defect.
- **Impact**: One-sentence description of who is affected and how badly.
- **Reproduction / Evidence**: Concrete steps or a code excerpt that proves it. If code, use a fenced block.
- **Suggested fix**: One or two sentences. Optional if the fix is obvious.
- **Confidence**: high | medium — how sure the agent is this is a real bug.
```

### Not reported (optional)

`## Not reported`

Short bulleted list of candidates the agent considered but rejected during triage, with a one-line reason. Helps future runs skip the same false positives. Only include if you actually rejected something noteworthy — don't invent entries.

### Next focus

`## Next focus`

`Tomorrow's focus: functional | visual | performance | security`

Must match what the agent wrote to `agent/memory/focus-rotation.json` for the next run.

## Rules the parser enforces

1. Front matter must be the first thing in the file, delimited by `---` lines.
2. Bug IDs must be unique and match the pattern `BUG-YYYYMMDD-NN`.
3. Every bug block must contain **Severity**, **Files**, **Summary**, and **Impact** — the other fields are recommended but not required.
4. Severity must be one of `P0`, `P1`, `P2`, `P3`.
5. Zero-bug reports still need the Summary and Next focus sections.
