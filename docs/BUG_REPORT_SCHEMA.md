# Bug Report Schema

The Telos Bug Hunter writes one Markdown file per run at `agent/reports/YYYY-MM-DD.md`. The orchestrator parses these files to send the daily email digest, so the format below is a hard contract.

## File name

```
agent/reports/YYYY-MM-DD.md
```

ISO date in the local (US Eastern) timezone of the run.

## Top-level structure

```markdown
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** functional | visual_ux | performance | security
**Findings:** N (P0: a, P1: b, P2: c, P3: d)
**Run status:** clean | findings | blocked

## Summary

One paragraph (under 80 words) describing the run. If zero bugs, say so plainly.

## Findings

(Repeat one block per bug, or omit the section if zero findings.)

### [P{0-3}] {Short title}

- **ID:** YYYY-MM-DD-NN  (NN = 01, 02, ... in order of appearance)
- **Area:** {file path or subsystem}
- **Reproduction:** {exact steps or code path}
- **Impact:** {who is affected and how}
- **Suggested fix:** {one-line recommendation, optional}
- **Confidence:** high | medium

## Notes

(Optional. Patterns observed, areas explored, follow-ups for tomorrow. Omit if empty.)
```

## Field rules

- **Focus** must match the value in `agent/memory/focus-rotation.json` for the run.
- **Run status:**
  - `clean` — zero findings, hunt completed normally
  - `findings` — at least one finding included
  - `blocked` — could not hunt (missing tools, infra failure); explain in Summary
- **ID** is unique per report, monotonic. The orchestrator uses it to dedupe across runs.
- **Confidence** must be `high` for P0/P1. `medium` is allowed for P2/P3.
- **No emojis**, no decorative headers, no horizontal rules between findings.

## Validation

A finding is invalid (and will be rejected by the parser) if:
- It lacks an `ID`, `Area`, `Reproduction`, or `Impact` line
- The severity in the heading does not match the implied prefix in the ID
- The file is empty or malformed Markdown

## Example

```markdown
# Telos Bug Hunter — 2026-05-10

**Focus:** functional
**Findings:** 1 (P0: 0, P1: 1, P2: 0, P3: 0)
**Run status:** findings

## Summary

One P1 found in the client password-reset flow: tokens are never expired server-side after use.

## Findings

### [P1] Password reset token reusable after consumption

- **ID:** 2026-05-10-01
- **Area:** api/client/reset-password.js
- **Reproduction:** POST with a valid token, then POST again with the same token; second call still succeeds.
- **Impact:** A leaked reset link can be replayed indefinitely until natural TTL.
- **Suggested fix:** Delete `password_reset:{token}` immediately after a successful reset.
- **Confidence:** high
```
