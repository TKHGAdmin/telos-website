# Bug Report Schema

Daily reports live at `agent/reports/YYYY-MM-DD.md` and must follow this exact structure. The orchestrator parses these fields.

## Frontmatter

```yaml
---
date: YYYY-MM-DD
focus: Functional | Visual/UX | Performance | Security
findings_count: <integer>
---
```

## Body

### Summary
One or two sentences stating what was hunted and what was found. If zero bugs, say so plainly.

### Findings

Each finding is a `###` section with this structure:

```
### [P0|P1|P2|P3] <short title>

**File:** `<path>:<line>` (or `<path>` if range)
**Category:** <functional|visual|performance|security|accessibility|convention>
**Status:** new | recurring (reference prior bug id)

**What:** One sentence stating the defect.

**Why it matters:** One sentence on real-user impact.

**Repro / evidence:** Concrete steps or exact lines proving it.

**Suggested fix:** One-line direction (not a full patch).
```

If zero findings, omit the Findings heading and write "No bugs found today." under Summary.
