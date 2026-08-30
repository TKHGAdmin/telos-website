# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must follow this layout. The email formatter parses these fields — deviate and the run silently breaks.

## Frontmatter

```
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bugs_found: <integer>
approvals_needed: <integer>
---
```

## Body

Start with a one-paragraph summary. If zero bugs found, say so plainly and stop.

Then, for each finding, one `##` section with exactly this shape:

```
## <severity>: <one-line title>

- **File**: `<repo-relative path>:<line>` (or `multiple` with paths in Evidence)
- **Category**: functional | visual-ux | performance | security
- **Reproducing**: <shortest concrete steps or code path a reader can follow>
- **Impact**: <who is affected and how, one sentence>
- **Evidence**: <code excerpt, log, or trace showing the bug>
- **Suggested fix**: <one-line direction or a small diff>
- **Confidence**: high | medium
```

`<severity>` is one of `P0`, `P1`, `P2`, `P3` (definitions in `.claude/AGENT_INSTRUCTIONS.md`).

Rules:

- Order sections most-severe first.
- Never include a finding you would score as `medium` confidence unless you have already ruled out the obvious counter-explanations in the Evidence field.
- Redact secrets: `sk-...REDACTED`.
- If a finding recurs from a prior report, add a `- **Prior**: reports/YYYY-MM-DD.md#<anchor>` line and the words `Still unresolved.` in the summary.
