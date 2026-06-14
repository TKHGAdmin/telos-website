# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must follow this exact structure. The orchestrator parses it to build the approval email.

## Required structure

```
# Telos Bug Hunter Report - YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Findings:** N
**Approval rate (last 14 days):** X% (or "no signal yet")

---

## Findings

### BUG-YYYY-MM-DD-NN | <severity P0|P1|P2|P3> | <one-line title>

**Where:** path/to/file.ext:line (or "live: https://...")
**Repro:**
- Step 1
- Step 2
- Step 3

**What's wrong:** 1-3 sentences.

**Suggested fix:** 1-3 sentences (or code snippet).

**Confidence:** high | medium

---
```

## Rules

- Bug IDs are `BUG-YYYY-MM-DD-NN` where NN is zero-padded sequence within the day.
- If zero bugs found, replace the `## Findings` body with: `No new bugs this run.`
- Severity is one of `P0`, `P1`, `P2`, `P3` (see agent system prompt for definitions).
- `Confidence` is the agent's own subjective certainty. `medium` is allowed only when triage gate is satisfied but reproduction depends on conditions outside the agent's reach (e.g. specific browser, specific data shape).
- Never include speculative bugs or wishlist items.
- Use plain text. No emojis. No nested headings beyond `###`.

## Parser contract

The orchestrator extracts findings by splitting on `### BUG-` and reads:
- Severity (token following the first `|`)
- Title (token following the second `|`)
- All labeled fields (`Where:`, `Repro:`, `What's wrong:`, `Suggested fix:`, `Confidence:`)

Any deviation breaks parsing and the email won't send. Keep field labels exactly as written.
