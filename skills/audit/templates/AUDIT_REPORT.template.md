<!--
Template notes (delete this comment in the real report).
Fill every {{placeholder}}. Keep section order. "Start here" and every
"In plain words" line are for a non-specialist: short sentences, no jargon,
say what could go wrong.

Example finding (filled):

### SEC-001 Anyone can read any user's invoices
- Severity: High
- Confidence: Confirmed
- Files: src/routes/invoices.js:14 (getInvoice)
- Evidence: `db.query("SELECT * FROM invoices WHERE id = " + req.params.id)` at src/routes/invoices.js:14; no check that the invoice belongs to the logged-in user.
- Exploit scenario / impact: a logged-in user changes the number in the URL and sees other people's invoices.
- Recommended fix: look up by id AND owner, use a parameterized query.
- Verification: Confirmed by independent verifier.
- In plain words: Any signed-in user can open other customers' invoices by changing a number in the web address.
- Task: SEC-001 in AUDIT_TASKS.md
-->

# Audit Report: {{project_name}}

Date: {{date}} | Scope: {{scope}} | Commit: {{commit_or_not_a_git_repo}}

## Start here

**Verdict:** {{verdict_2_to_3_plain_sentences}}

**Scorecard** (rules in SKILL.md; sorted by fix order, address 1 first):

| Fix order | Area | Score /10 | Rating | Why (plain words) | Start with |
|-----------|------|-----------|--------|-------------------|------------|
| 1 | {{area}} | {{score}} | Poor / Needs work / Fair / Good | {{one_line_plain_reason}} | {{task_ids}} |

**Fix these first** (at most 10):

| # | Task | What could go wrong (plain words) |
|---|------|-----------------------------------|
| 1 | {{task_id}} | {{one_line_plain_risk}} |

Everything below is the technical detail. You can hand AUDIT_TASKS.md to an AI agent without reading it.

## Architecture summary

{{phase0_architecture_summary}}

## Coverage gaps and assumptions

- Layers/boundaries skipped and why: {{skipped_layers}}
- Tools run (and results) or missing: {{tooling_notes}}
- Build/lint/test results: {{build_lint_test_results}}
- Areas not inspected, and why: {{not_inspected}}
- Assumptions: {{assumptions}}
- Unverified findings: Medium/Low findings are reported as found and labeled "Unverified (not independently re-checked)".

## Security by severity

### Critical
{{security_critical_findings_or_"No findings. Checked: ..."}}

### High
{{security_high_findings}}

### Medium
{{security_medium_findings}}

### Low
{{security_low_findings}}

Per finding use: ID, severity, title, affected files; evidence (quoted code, file:line); exploit scenario or failure mode; impact; recommended remediation; suggested verification; confidence (Confirmed | Needs runtime/config verification) and assumptions; verification (Confirmed | Unverified); In plain words; task ID.

## Optimization by priority

Group by tag: Scale, Lean, Reliability, Tests.

### High priority
{{optimization_high_findings}}

### Medium priority
{{optimization_medium_findings}}

### Low priority
{{optimization_low_findings}}

Per finding use: ID, priority, Tag, category, affected files; evidence and expected benefit (measured | speculative, with measurement plan if speculative); recommended change; effort; risk; validation; confidence; In plain words; task ID.

## Traceability map

{{trace_overview_chain_per_feature}}

### Broken and partial flows

{{trace_findings: per TRC- ID give complete call chain, exact failing boundary, affected files, expected vs actual contract, user impact, recommended fix, confidence, In plain words, task ID}}

## Positive findings

{{important_flows_and_controls_verified_working}}

## Counts

| Area | Critical / High | Medium | Low | Total |
|------|-----------------|--------|-----|-------|
| Security (SEC-) | {{n}} | {{n}} | {{n}} | {{n}} |
| Optimization (OPT-/TST-), by priority High / Medium / Low | {{n}} | {{n}} | {{n}} | {{n}} |
| Traceability (TRC-), Broken / Partial / other | {{n}} | {{n}} | {{n}} | {{n}} |

## Appendix: rejected and downgraded findings

| ID | Original claim | Verdict | Reason (standalone) |
|----|----------------|---------|---------------------|
| {{id}} | {{claim}} | Rejected(...) / Downgraded(...) | {{reason}} |

## Coverage table

Every action or entry point from the inventory (UI actions, or routes/commands/exports/jobs/webhooks for non-UI projects).

| Action ID | Page/Component or entry point | file:line | Status | Finding IDs |
|-----------|-------------------------------|-----------|--------|-------------|
| {{action_id}} | {{component}} | {{file:line}} | Verified end-to-end / Partially verified / Broken / Unreachable/dead UI / Not auditable from repository evidence | {{ids_or_dash}} |
