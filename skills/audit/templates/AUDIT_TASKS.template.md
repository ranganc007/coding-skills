<!--
Template notes (delete this comment in the real file).
One task per verified finding, ordered by severity/priority then dependency.
Each task must be understandable without the report.

Example task (filled):

### SEC-001 Scope invoice lookup to the signed-in user
- In plain words: Any signed-in user can open other customers' invoices by changing a number in the address. This fixes it.
- Category: Security
- Priority/Severity: High
- Description & evidence: src/routes/invoices.js:14 builds `"SELECT * FROM invoices WHERE id = " + req.params.id` with no owner check.
- Files touched: src/routes/invoices.js, tests/invoices.test.js
- Acceptance criteria: user A requesting user B's invoice gets 404; query is parameterized.
- Suggested tests/verification: add a test with two users; run the test suite.
- Depends on / blocked by: none
- Effort: Small
- Safe implementation notes: no migration; response for missing invoice stays 404.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task SEC-001 in AUDIT_TASKS.md: Scope invoice lookup to the signed-in user.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch: src/routes/invoices.js, tests/invoices.test.js.
Acceptance criteria: user A requesting user B's invoice gets 404; query is parameterized.
Add tests that prove this. When finished, set Status: Done with a one-line note.
```
-->

# Audit Tasks: {{project_name}}

Generated {{date}} from AUDIT_REPORT.md. Each task is self-contained: paste its Fix prompt into an AI agent.

### {{ID}} {{Title}}
- In plain words: {{one_or_two_plain_sentences_no_jargon}}
- Category: Security | Optimization | Traceability | Testing
- Priority/Severity: {{severity_or_priority}}
- Description & evidence: {{description_with_file:line}}
- Files touched: {{exact_file_list}}
- Acceptance criteria: {{criteria}}
- Suggested tests/verification: {{tests}}
- Depends on / blocked by: {{ids_or_none}}
- Effort: Small | Medium | Large
- Safe implementation notes: {{risks_migrations_compat_rollout}}
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task {{ID}} in AUDIT_TASKS.md: {{Title}}.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: {{exact_file_list}}.
Context: {{one_or_two_sentences_of_description_and_evidence_file:line}}
Acceptance criteria: {{criteria}}
Add or update tests that satisfy the acceptance criteria ({{tests}}).
When finished, set Status: Done with a one-line note.
```

## Parallel groups

Sets of tasks with no overlapping files that can be worked on concurrently.

- Group 1: {{task_ids}}
- Group 2: {{task_ids}}

## Instructions for sub-agents

- Set `Status: In progress` and `Claimed-by:` before starting a task.
- Only touch the listed files.
- Add or update tests that satisfy the acceptance criteria.
- Set `Status: Done` with a one-line note when finished.
