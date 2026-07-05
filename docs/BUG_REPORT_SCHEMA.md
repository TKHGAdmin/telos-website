# Bug Report Schema

Every daily report lives at `agent/reports/YYYY-MM-DD.md` and must follow this schema exactly. The email formatter parses these files by heading level and field name — deviations break the send.

## File layout

```
# Telos Bug Report — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Findings:** <count>
**Approval rate (rolling 30d):** <NN%> (or "n/a" on first runs)

---

## Summary

<One paragraph. What you looked at, what you found, and the headline.>

---

## Findings

### [P0|P1|P2|P3] <short title>

- **File:** `path/to/file.ext:line`
- **Category:** <e.g. layout, auth, data-loss, xss, perf, a11y>
- **What's wrong:** <one paragraph — the defect stated plainly>
- **How to reproduce:** <steps or the exact code trace>
- **Failure scenario:** <concrete inputs → concrete wrong output>
- **Suggested fix:** <a specific edit, not "consider refactoring">

(Repeat one block per finding. Findings are ordered most-severe first.)

---

## Zero-bug report

If you found nothing, replace the `Findings` section entirely with:

```
## Findings

No new bugs found today. Reviewed <what you reviewed> — everything checks out against the criteria for today's focus.
```

Do not pad. Do not invent low-severity items to fill space.
```

## Field rules

- **Focus** must be exactly one of the four values.
- **File** paths are repo-relative and always include a line number.
- **Severity** must be exactly `P0`, `P1`, `P2`, or `P3`. Use the definitions in `agent/AGENTS.md`.
- **How to reproduce** must be concrete. "Sometimes fails on mobile" is not acceptable; "on iPhone SE viewport (375px), the CTA button overflows the container" is.
- **Suggested fix** points at the specific line/change, not a philosophy.

## Duplicate handling

Before writing a finding, grep the last 14 days of reports for the same file/line. If it's a re-report, add a `**Prior report:**` line with the date of the earlier report and note "still unresolved" or "regressed after fix on <date>".
