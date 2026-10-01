# Bug Report Schema

The Telos Bug Hunter writes one report per run to `agent/reports/YYYY-MM-DD.md`.

Reports MUST follow this exact structure so the `run.py` orchestrator can parse them and build the daily email.

## Top-level structure

```
# Telos Bug Report - YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security | Multi-focus (first run)>
**Summary:** <one-sentence verdict for the whole run>
**Bugs found:** <N>

---

## Bug 1 - <P0 | P1 | P2 | P3> - <Short title>

**Category:** <functional | visual | performance | security>
**Files:** `path/to/file.ext:line` (one per line, repeat as needed)
**Reproduction:**
<Numbered or bulleted steps, or a code trace. Must be concrete, not theoretical.>

**Impact:**
<Who is affected and how.>

**Suggested fix:**
<One or two sentences. Be specific - name the function/line to change.>

**Confidence:** <high | medium | low>

---

## Bug 2 - ...
```

## Rules

- Severity is one of P0, P1, P2, P3 (see `agent/AGENT.md` for definitions).
- Bugs are ordered most severe first.
- Every bug must have Files, Reproduction, Impact, Suggested fix, and Confidence.
- If zero bugs were found, write a single section titled `## No bugs found` with one or two sentences describing what you checked.
- Never pad. Never speculate. Never report style preferences.
- Secrets must be redacted (e.g. `sk-ant-api03-REDACTED`).

## Zero-bug template

```
# Telos Bug Report - YYYY-MM-DD

**Focus:** Performance
**Summary:** No bugs found. Scanned bundle sizes, image optimization, and render-blocking scripts across all public pages.
**Bugs found:** 0

---

## No bugs found

<One or two sentences on what you checked and why nothing met the bar.>
```
