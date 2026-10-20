# Source prompt (verbatim from the author): Full Codebase Audit

# Full Codebase Audit: Security, Optimization, Traceability

Review the entire codebase as a senior engineering and security team. Assume the code may contain junior-level mistakes and that nothing is safe until verified. **This phase is a read-only audit: do not modify production code.** The only files you create are the deliverables listed at the end.

Prefer fewer well-supported findings over many guesses. Every finding must cite file:line evidence. Do not invent findings.

---

## Phase 0: Architecture discovery (do this first, yourself)

Inspect the repository and document:
- Architecture, frameworks, languages, and monorepo/package layout
- Entry points: UI routes/pages, API routes, server actions, serverless functions, background jobs, queues, cron, webhooks
- Build, lint, and test commands, and whether they run successfully
- Database technology, ORM, schema/migrations location, and access controls (e.g. RLS)
- Authentication and authorization model (session/JWT/provider, middleware, role checks)
- External integrations and third-party APIs
- Deployment and configuration (env vars, hosting config, CI)
- Areas you could not inspect, and why

Use this to choose the traceability layers in Phase 2. The default layers are: UI → client/API layer → middleware/auth → routes/controllers/server actions → services/domain logic → data access/ORM → database/schema. Add layers for queues, background jobs, serverless functions, or third-party integrations if present.

---

## Shared rules for all agents

**ID prefixes:** SEC- (security), OPT- (optimization), TRC- (traceability), TST- (testing gaps).

**Tooling:** where available, run dependency audit (npm audit / pip-audit / equivalent), dead-code detection (knip, ts-prune, vulture), duplication detection (jscpd), and static analysis (semgrep, linters). Confirm tool output by reading the code; tool output alone is not a finding.

**Confidence:** mark every finding **Confirmed** (proven from code) or **Needs runtime/config verification** (depends on environment, deployment, or data). State any assumptions.

**Deduplication:** if a problem spans areas (e.g. a missing auth check that also breaks a trace), report it once under its primary area and cross-reference the ID in the other areas.

---

## Phase 1: Run these agents in parallel

### Agent 1: Security audit

Deep review across frontend, backend, APIs, authN/authZ, data access, configuration, dependencies, secrets handling, logging, file handling, network calls, and deployment config. Cover at minimum:
- Auth checks on every route, server action, and function
- IDOR
- Injection (SQL, command, template, XSS)
- SSRF
- Secrets in code, client bundles, or logs
- Input validation
- CORS, CSP, and security headers
- Rate limiting and abuse
- Session/token handling
- File uploads
- Database permissions/RLS
- Dependency CVEs

For every finding provide:
- ID, severity, title, and affected files/functions
- Evidence: precise code path and how the issue manifests
- Exploit scenario or realistic failure mode
- Impact
- Recommended remediation
- Suggested verification or test
- Confidence and assumptions

Severity:
- **Critical:** likely remote compromise, major data exposure, privilege escalation, or destructive impact with little or no prerequisite access.
- **High:** serious unauthorized access, sensitive-data exposure, or impactful abuse requiring limited conditions.
- **Medium:** meaningful weakness with constraints or reduced impact.
- **Low:** defense-in-depth, hardening, or limited-risk issue.

### Agent 2: Optimization and maintainability audit

Review for:
- **Dead code:** unreachable code, unused dependencies, unused exports, stale feature flags, orphaned files and routes.
- **Duplication:** duplicated or near-duplicated logic, especially logic appearing in 3+ places.
- **Code shape:**
  - functions over ~60 lines or with high complexity
  - trivial wrappers and over-fragmented code that add no value
  - poor naming
- **Performance:**
  - N+1 queries and missing indexes
  - redundant network/database calls
  - expensive rendering and unnecessary client components
  - memory/resource leaks
  - poor caching
  - avoidable blocking work
  - inefficient algorithms
  - bundle size
- **Reliability:** issues causing retries, timeouts, duplicate work, or poor observability.
- **Test gaps:** missing tests around critical behavior (use TST- IDs).

For every finding provide:
- ID, priority (High/Medium/Low), category, and affected files/functions
- Evidence and expected benefit, labelled **measured** or **speculative**. A speculative finding needs a measurement plan.
- Recommended change
- Effort (Small/Medium/Large)
- Risk of making the change
- Suggested validation

No speculative micro-optimizations without evidence or a measurement plan.

### Agent 3: Entry-point inventory (Phase 2 depends on this)

List every user-facing UI control that invokes application code:
- buttons, links to internal actions, and form submissions
- menu actions and keyboard shortcuts
- effects or programmatic triggers

For each, record:
- an action ID
- page/component, file:line
- the trigger type and the handler
- the first function/endpoint called, with its arguments
- whether the action requires authentication

List external-URL navigation separately; it is not traced further. Output the inventory as a table.

---

## Phase 2: Traceability, one agent per layer boundary

Using Agent 3's inventory, assign **one agent per boundary** (e.g. UI→client, client→route, route→middleware/auth, route→service, service→data access, data access→DB, service→external API). Each agent owns its boundary for every action, so each boundary is checked exactly once.

If there are more than ~50 actions, also split agents by feature area and note this in the coverage notes.

The full chain for each action, forward and return:

UI control → event handler → client function/hook → API request or local state action → route/controller/handler → middleware/authN/authZ → service/domain logic → data access/ORM/query → database or external service → response/return value → client-side processing → UI result/loading/error state

At its boundary, each agent verifies:
- The handler is reachable from the UI.
- The called function exists and is invoked correctly.
- Signatures match the callers: argument names, order, optionality, types, and serialization format.
- Request method, URL/path, params, body, headers, and auth context match server expectations.
- Backend validation, authorization, and error handling match the client's assumptions.
- Response shape, status codes, and null/error cases match what the caller consumes.
- DB queries and mutations touch the intended entities and fields and return the expected result.
- User-visible success, loading, and failure states reflect the actual result.

Trace authenticated and unauthenticated paths where applicable.

Classify each action as:
- Verified end-to-end
- Partially verified
- Broken
- Unreachable/dead UI
- Not auditable from repository evidence

For every mismatch or break (TRC- ID), provide:
- the complete call chain
- the exact failing boundary
- the affected files
- expected vs. actual contract
- the user impact
- the recommended fix

---

## Phase 3: Independent verification

Launch a fresh agent that has not seen the other agents' reasoning. Have it re-check every Critical/High security finding, every High optimization finding, and every Broken trace, using only the cited evidence. It marks each one **Confirmed**, **Downgraded** (with new severity), or **Rejected** (with reason). Only verified results flow into the deliverables; record rejected items in an appendix.

---

## Deliverables

### 1. `AUDIT_REPORT.md`

**Executive summary**, in plain language for a non-specialist leader:
- Overall risk assessment
- The 5–10 most urgent issues and why they matter
- An architecture summary (from Phase 0)
- Coverage gaps and assumptions

**Detailed technical report:**
- Security findings by severity
- Optimization findings by priority
- Traceability map, with broken and partial flows in detail
- Positive findings: important flows and controls verified as working correctly
- A summary table of counts by area × severity/priority
- Appendix: rejected or downgraded findings from Phase 3

**Coverage table:** every UI action from the inventory with its traceability status and any related finding IDs.

### 2. `AUDIT_TASKS.md`: backlog for sub-agents

Write one task per verified finding (findings may be grouped only when one fix resolves them together). Order by severity/priority, then by dependency. Each task includes:

```
### [ID] Title
- Category: Security | Optimization | Traceability | Testing
- Priority/Severity:
- Description & evidence: (file:line)
- Files touched: (exact list — used to avoid edit conflicts)
- Acceptance criteria:
- Suggested tests/verification:
- Depends on / blocked by:
- Effort: Small | Medium | Large
- Safe implementation notes: (risks, migrations, backwards compatibility, rollout)
- Status: Open
- Claimed-by:
```

End the file with a **Parallel groups** section: sets of tasks with no overlapping files that can be worked on concurrently. Then add instructions for sub-agents:
- Set `Status: In progress` and `Claimed-by:` before starting a task.
- Only touch the listed files.
- Add or update tests that satisfy the acceptance criteria.
- Set `Status: Done` with a one-line note when finished.

---

Be precise, evidence-based, and concise.
