# Bug Report Schema

Reports written by the Telos Bug Hunter agent live in `agent/reports/YYYY-MM-DD.md` and follow this schema. The orchestrator parses these to format daily emails.

## Required structure

```markdown
# Telos Bug Hunt - YYYY-MM-DD

**Focus**: <Functional | Visual/UX | Performance | Security>
**Bugs found**: <integer>
**Summary**: <one or two sentences>

---

## Bugs

### [P0|P1|P2|P3] <short title>

**ID**: `YYYY-MM-DD-NN`
**File(s)**: `path/to/file.js:line`
**Category**: <Auth | Rate Limit | XSS | IDOR | Input Validation | CORS | Secrets | Other>

**What's wrong**
<2-4 sentences describing the bug, what it allows, and why it matters>

**Reproduction**
<exact steps, request, or pointer to lines>

**Suggested fix**
<concrete, minimal change>

---

(repeat per bug)

## Notes
<anything the human should know that doesn't fit the bug schema; optional>
```

## Rules

- ID is `YYYY-MM-DD-NN` zero-padded, starting at `01`
- Severities: P0 (breaking/data exposure), P1 (degraded UX for many), P2 (edge cases), P3 (polish/tech debt)
- Each bug must include file path with line numbers
- "Bugs found: 0" is valid; in that case omit the `## Bugs` section entirely and write a one-paragraph summary in `## Notes`
- Do not include speculative findings
- Redact any leaked secrets in code samples (e.g. `sk-ant-api03-REDACTED`)
