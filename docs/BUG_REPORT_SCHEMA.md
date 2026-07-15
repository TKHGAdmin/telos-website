# Telos Bug Hunter — Report Schema

This is the contract the autonomous QA agent uses to emit its daily report. The email/parser depends on this exact structure. Any deviation breaks the pipeline.

Report path: `agent/reports/YYYY-MM-DD.md`

## File structure

Every report is a Markdown file with the following blocks, in this order.

### 1. Front-matter (YAML)

```
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bugs_found: <integer>
zero_findings: true | false
duration_minutes: <integer, optional>
---
```

### 2. Summary (one paragraph, no heading)

2-4 sentences. What was hunted, what shape the results are (all P1, mostly P3, one hot P0, whatever), and any signal Thomas should act on immediately.

### 3. Findings

For each bug, one block matching this template. Bugs ordered by severity (P0 → P3), then by confidence within each severity.

```
### [P0|P1|P2|P3] <one-line title>

**ID:** `<YYYY-MM-DD>-<slug>`
**File:** `path/to/file.ext:line` (or "multiple", listed in Evidence)
**Category:** <short slug — auth, rate-limit, data-integrity, xss, ui, perf, a11y, etc.>

**What's wrong**
1-3 sentences describing the defect factually. No hedging.

**How to reproduce**
Concrete steps or code trace. Include exact line refs. Skip if the finding is a code-level defect where the file:line + snippet is the whole proof.

**Impact**
Who is affected, what happens to them, and how often. Be specific — "one client per year" and "every client on every login" get very different responses.

**Suggested fix**
One paragraph or a code snippet. Not required to be perfect — Thomas may choose a different approach.

**Confidence:** high | medium | low
```

### 4. Zero-findings block (only if `zero_findings: true`)

Replace the Findings section with:

```
## No findings today

<1-2 sentences on what was checked and why nothing surfaced. Don't pad.>
```

### 5. Notes (optional)

Anything worth mentioning that's not itself a bug — patterns worth watching, areas that need more time next rotation, false-positive templates that were tempting but rejected.

## Rules

- **No em dashes.** Use hyphens.
- **No emojis.**
- **Line refs are exact.** `client-dashboard.html:1840` — not "around line 1840" or "in the todayStr function".
- **Redact secrets.** If you find one, mask everything after a stable prefix: `sk-ant-api03-REDACTED`.
- **Do not report the same bug twice.** Cross-reference the prior report ID if a bug recurs.
- **The parser is strict.** Front-matter must be first, keys must match exactly, severity tags in headings must be bracketed exactly as `[P0]` / `[P1]` / `[P2]` / `[P3]`.
