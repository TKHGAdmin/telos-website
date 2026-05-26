# Bug Report Schema

The Telos Bug Hunter writes one Markdown file per run to `agent/reports/YYYY-MM-DD.md`.
The orchestrator (`run.py`) parses this file to build the daily email and to record decisions in `agent/memory/decisions.jsonl`. Break the schema and the parser will skip the report.

---

## File location

```
agent/reports/2026-05-26.md
```

Filename is the UTC date the hunt started, `YYYY-MM-DD.md`. One report per day. If you re-run on the same day, overwrite — don't append a suffix.

## Required structure

### 1. Front matter (YAML)

```yaml
---
date: 2026-05-26
focus: functional        # one of: functional | visual-ux | performance | security
bugs_found: 3            # integer count of bugs listed below (0 is valid)
duration_minutes: 18     # rough wall-clock time spent hunting
---
```

All four fields required. If `bugs_found: 0`, the body below is just the "Zero findings" section — no bug entries.

### 2. Summary (one paragraph)

A 2-4 sentence prose summary of what was hunted, what surfaced, and what was deliberately not checked. No bullet points here.

### 3. Bug entries (zero or more)

Each bug is a Level-2 heading. The exact format below is what the parser keys on:

```markdown
## BUG-YYYYMMDD-NN — <short title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <short path or feature label, e.g. `js/shop.js`, `client dashboard / nutrition tab`>
- **Status:** new            <!-- always `new` from the agent; orchestrator updates after triage -->

**Reproduction**
1. Step
2. Step
3. Step

**Why it matters**
One or two sentences. Who is affected and what's the user-visible consequence.

**Evidence**
Code reference using `file:line` style, or a curl command, or a screenshot path. Be specific enough that Thomas can verify without searching.

**Suggested fix**
A short description of the fix shape. Not a full patch — that's Thomas's call.
```

`BUG-YYYYMMDD-NN` — date + zero-padded counter scoped to that day's report (`BUG-20260526-01`, `BUG-20260526-02`, ...).

### 4. Zero findings section (only when `bugs_found: 0`)

```markdown
## Zero findings today

Brief note on what was checked and why nothing rose above the triage gate.
Optionally: one or two "watching but not reporting" items for future runs.
```

Do not pad with bugs to avoid this section. A clean day is a valid report.

---

## Hard rules

- Severity must be exactly `P0`, `P1`, `P2`, or `P3` — the parser is case-sensitive.
- `Status` is always `new` in the agent's output. The orchestrator flips it to `approved` / `denied` / `fixed` based on Thomas's response.
- Bug IDs must be unique within the file and follow the `BUG-YYYYMMDD-NN` shape.
- Don't add sections the schema doesn't define. Extra Level-1 (`#`) or Level-2 (`##`) headings will confuse the parser.
- Code blocks inside Evidence are fine; just don't introduce new top-level headings inside them.
