# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this shape. The email parser depends on it.

## Frontmatter (YAML)

```yaml
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
findings_count: <integer>
approver: thomas
---
```

## Body

### If findings_count == 0

A single H2 heading `## No findings today` followed by a one-paragraph note on what was hunted and why nothing surfaced. No filler.

### If findings_count > 0

For each finding, one section, ranked most-severe first:

```markdown
## <BUG-YYYYMMDD-N> — <P0|P1|P2|P3> — <60-char summary>

**Files:** `path/to/file:line[-line]` (comma-separated if multiple)

**Summary:**
One sentence stating the defect.

**Reproduction / evidence:**
Concrete steps, or the exact lines that prove the defect. If UI, describe viewport and what breaks.

**Impact:**
Who is affected and how. Be honest — "seen by desktop visitors on the product page" is better than "all users everywhere."

**Suggested fix:**
The smallest correct change. Not a full implementation, just the direction.

**Confidence:** high | medium
```

## ID convention

`BUG-YYYYMMDD-N` where N starts at 1 for that day's report and increments per finding.

## Verdict shortcuts (for Thomas)

At the bottom of every non-empty report, include:

```markdown
---

## Verdict

Reply with the bug ID and one of: `approved`, `denied`, `duplicate`, `fixed`. Multiple bugs on one line OK (e.g. `BUG-20260925-1 approved BUG-20260925-2 denied`).
```

## Hard schema rules

1. Frontmatter is required, exactly the four keys above, in that order.
2. No emoji, no decorative headers.
3. Every finding section heading MUST match the regex `^## BUG-\d{8}-\d+ — P[0-3] — .{1,60}$`.
4. Files field MUST use backtick-wrapped `path:line` format for click-to-jump.
5. No trailing whitespace on any line. No CRLF.
