# Bug Report Schema

This schema is the contract between the Telos Bug Hunter agent and the email/review pipeline. The parser is strict — do not deviate from headings, section order, or field names.

Reports live at `agent/reports/YYYY-MM-DD.md` (one per run).

---

## File template

```markdown
# Telos Bug Hunter — YYYY-MM-DD

- Run: <run_id>
- Focus: <Functional | Visual/UX | Performance | Security>
- Findings: <count>
- Approval rate to date: <optional>

## Summary

<one to three sentences>

## Findings

### <bug_id> — <short title>

- Severity: <P0 | P1 | P2 | P3>
- Area: <code path, page, or endpoint>
- Confidence: <high | medium | low>
- Status: new

**What's wrong**

<one paragraph, plain English>

**Reproduction**

<numbered steps OR file:line pointers>

**User impact**

<one to two sentences>

**Suggested fix**

<optional, one to three sentences>

---

## Notes

<optional freeform: patterns noticed, follow-ups, uncertainty>
```

---

## Rules

1. **`bug_id` format**: `YYYYMMDD-NN` (e.g., `20260724-01`, `20260724-02`). Sequential per report.
2. **Severity** must be one of exactly: `P0`, `P1`, `P2`, `P3`. See system prompt for definitions.
3. **Confidence** must be one of exactly: `high`, `medium`, `low`. Low-confidence findings should be rare — prefer to omit.
4. **Status** on a new report is always `new`. Later reports may reference the same bug with `unresolved`, `fixed`, or `wontfix`.
5. **Zero findings** — the `## Findings` section is written as:
   ```
   ## Findings

   None. See summary for what was checked.
   ```
   Do NOT invent a placeholder finding to fill space.
6. **Redacted secrets** — any credential-like string in a report must be replaced with a redaction marker, e.g. `sk-ant-api03-REDACTED` or `AKIA...REDACTED`. Never paste a real secret into the report.
7. **No em dashes** in report body (project convention). Use hyphens.
8. **Length** — each finding's "What's wrong" paragraph should be under 80 words. Reproductions can be longer.

---

## Example (single finding)

```markdown
# Telos Bug Hunter — 2026-07-24

- Run: 001
- Focus: Functional
- Findings: 1

## Summary

Reviewed the recent shop/product commits and the API auth surface. One P2 issue found in the product page's deep-link handling.

## Findings

### 20260724-01 — Product deep link renders blank when Shopify SDK slow

- Severity: P2
- Area: product.html
- Confidence: high
- Status: new

**What's wrong**

The add-to-cart button is rendered before the Shopify Buy SDK finishes loading. Clicking it during the first ~800ms on a cold cache is a no-op with no visible feedback.

**Reproduction**

1. Hard-refresh product.html on a throttled 3G connection.
2. Click "Add to cart" within 1 second of paint.
3. Observe: no cart drawer, no error, no state change.

**User impact**

Users on slow connections may bounce, thinking the product page is broken.

**Suggested fix**

Disable the CTA until the SDK's `ready` promise resolves, or attach a loading skeleton.

---

## Notes

Checked but clean: auth endpoints, cron secret handling, quiz submit path.
```
