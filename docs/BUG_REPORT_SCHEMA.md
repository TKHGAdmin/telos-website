# Bug Report Schema

Each daily report lives at `agent/reports/YYYY-MM-DD.md` and MUST follow this structure exactly. The downstream parser (run.py / email emitter) depends on this contract.

## File location

`agent/reports/YYYY-MM-DD.md` — one file per run. ISO date in filename.

## Required structure

```markdown
# Bug Hunt Report - YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Bugs found:** <integer>
**Approval rate (last 14 days):** <integer>% or "N/A"

---

## Bug <N>: <one-line title>

- **ID:** `YYYY-MM-DD-<seq>`
- **Severity:** P0 | P1 | P2 | P3
- **Area:** <e.g. `index.html nav`, `api/dashboard/clients.js`, `client-dashboard tab`>
- **Status:** new | recurring (was `<prior-id>`)

### What's wrong
<2-4 sentences. Plain English. What does the user / developer experience?>

### Where
- File: `<path>:<line>`
- (Optional additional locations)

### Repro / evidence
<Either explicit reproduction steps or a code excerpt showing the defect.>

### Suggested fix
<1-3 sentences. Concrete. Not a redesign.>

---

(repeat for each bug)
```

## Zero-bug report

If the hunt found nothing worth reporting, the file MUST still be created. Use:

```markdown
# Bug Hunt Report - YYYY-MM-DD

**Focus:** <area>
**Bugs found:** 0
**Approval rate (last 14 days):** <integer>% or "N/A"

---

No actionable bugs found in today's <area> sweep.

**Areas examined:**
- <list 3-6 areas>

**Notes:**
<optional 1-3 sentences on what was looked at and why nothing rose to the bar.>
```

## Severity rubric

| Severity | Definition |
|---|---|
| P0 | Breaks core functionality or exposes user data |
| P1 | Degrades experience for many users |
| P2 | Affects some users or edge cases |
| P3 | Minor polish / tech debt worth flagging |

## Hard constraints

1. The first line is always `# Bug Hunt Report - YYYY-MM-DD`. The date in the heading must match the filename.
2. The metadata block (`Focus:`, `Bugs found:`, `Approval rate (last 14 days):`) appears immediately after the heading, in this order, separated by a horizontal rule (`---`) before the first bug.
3. Each bug heading is `## Bug <N>: <title>` with sequential `<N>` starting at 1.
4. Each bug includes the four bold metadata fields (`ID`, `Severity`, `Area`, `Status`) as a flat unordered list.
5. Each bug includes the four sub-sections in this order: `### What's wrong`, `### Where`, `### Repro / evidence`, `### Suggested fix`.
6. Bug IDs are unique across the lifetime of the agent. Format: `YYYY-MM-DD-<seq>` where seq is zero-padded to 2 digits.
7. No commentary outside the schema — no preamble, no closing summary, no "Hope this helps."
