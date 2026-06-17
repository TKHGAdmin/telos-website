# Bug Report Schema

This is the contract that every daily `agent/reports/YYYY-MM-DD.md` file must follow. The orchestrator (`run.py`) parses these files to build the approval email, so deviation breaks the pipeline.

## File location

`agent/reports/YYYY-MM-DD.md` (UTC date the report was generated).

## Required front matter

```yaml
---
date: 2026-06-17          # ISO date, must match filename
focus: functional         # one of: functional | visual_ux | performance | security
bugs_found: 3             # integer, 0 if none
agent_version: 1          # bump if the agent's reporting style changes materially
---
```

## Body sections (in this order)

### 1. Summary
One paragraph (2-4 sentences). State the focus area, what you covered, and the headline finding (or "no bugs found").

### 2. Findings
Zero or more findings, each as an H3 header with this exact structure:

```markdown
### BUG-YYYY-MM-DD-NN — <one-line title>

- **Severity:** P0 | P1 | P2 | P3
- **Location:** `path/to/file.ext:LINE` (or a range like `:120-145`)
- **Description:** One or two sentences. What is wrong.
- **Impact:** One sentence. Who is affected and how.
- **Reproduction:** Bulleted steps or a code excerpt.
- **Suggested fix:** One sentence, or a small diff in a fenced block.
- **Confidence:** high | medium  (only include findings with high or medium confidence)
```

`NN` is a zero-padded sequence within the day, starting at `01`.

### 3. Coverage notes
2-5 bullets describing what you looked at today (files, endpoints, flows). This anchors future runs so they don't re-walk the same ground.

### 4. Not-bugs investigated
Optional. Items you considered and rejected, with a one-line reason. Helps the maintainer (and future runs) understand your triage.

## Severity definitions

| Severity | Definition |
|---|---|
| P0 | Breaks core functionality or exposes user data |
| P1 | Degrades experience for many users |
| P2 | Affects some users or edge cases |
| P3 | Minor polish / tech debt worth flagging |

## Zero-bug reports

If no bugs were found, omit the "Findings" section entirely. Keep Summary and Coverage notes. `bugs_found: 0` in front matter. A zero-bug report is valid and expected on many days.
