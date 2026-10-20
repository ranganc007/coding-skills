---
name: audit
description: Full read-only codebase audit (security, maintainability/performance, and whether every UI action or entry point really works end to end). Use on "/audit", or when asked to audit or review the whole codebase, security-check it, or find maintainability, performance or code-quality problems. Writes AUDIT_REPORT.md (plain-language top, technical detail below) and AUDIT_TASKS.md (a backlog an AI agent can execute).
---

# /audit

Reviews a whole repo like a senior engineering and security team. Authoritative spec: `references/source-prompt.md`. Where it disagrees with this file, it wins.

## Hard rules

- Read-only. The only files written are `AUDIT_REPORT.md` and `AUDIT_TASKS.md` in the repo root. Never edit production code. Never install tools.
- Every finding quotes code and cites file:line. No finding from tool output or a hunch alone. Fewer well-supported findings beat many guesses.
- No padding. If an area has no findings, say so and list what was checked.
- IDs: `SEC-`, `OPT-`, `TRC-`, `TST-`. Confidence: **Confirmed** or **Needs runtime/config verification**.
- Use the Agent tool (not the Workflow tool unless the user asks). Set `model` explicitly on every Agent call: `sonnet` for finders and boundary agents, a more capable model only for the verifier. Launch independent agents in ONE message so they run in parallel.

## Arguments

- `/audit` audits the whole repo. `/audit <path>` narrows scope to that path; say so in the report.
- If `AUDIT_REPORT.md` or `AUDIT_TASKS.md` exists, never overwrite silently: ask the user, or write dated names (`AUDIT_REPORT_YYYY-MM-DD.md`).

## Phase 0 (you, the main session; no agents)

Inspect and write a summary (this becomes `{{phase0_summary}}`): architecture, frameworks, languages, package layout; entry points (UI routes, API routes, server actions, functions, jobs, queues, cron, webhooks); database, ORM, schema/migrations, access controls (RLS); auth model; external integrations; deployment/config/CI; areas you could not inspect and why. Run the build, lint and test commands and any installed audit/dead-code/duplication/static-analysis tools; record pass/fail. Missing tools or a non-git repo: note under coverage gaps, install nothing. Choose the trace layers: UI -> client/API -> middleware/auth -> routes/controllers -> services -> data access/ORM -> database, plus queues, jobs, functions or integrations if present.

## Placeholders

Read each reference file, substitute, and paste the result as the Agent prompt:

- `{{repo_root}}`: absolute path of the repo root.
- `{{scope}}`: `whole repo`, or the user's path argument.
- `{{phase0_summary}}`: your Phase 0 summary.
- `{{boundary}}`: one boundary name, e.g. `route->service`.
- `{{actions}}`: the inventory rows (ID, component, file:line, trigger, handler, first call + args, auth) to check; all of them, or one feature area's.
- `{{finding_id}}`, `{{claim}}`, `{{evidence}}`: the finding's ID; its claim with stated severity/priority/status; only its cited file:line and quoted code. Never the finder's reasoning.

## Phase 1 (one message, three agents, sonnet)

`references/agent-security.md`, `references/agent-optimization.md`, `references/agent-inventory.md` (vars: repo_root, scope, phase0_summary). Inventory output feeds Phase 2. For non-UI repos it lists routes, commands, exports, jobs and webhooks instead.

## Phase 2 (one message, sonnet)

One agent per boundary using `references/agent-trace-boundary.md`, each given every action, so each boundary is checked once. Skip boundaries that do not exist and state why in coverage gaps. Over about 50 actions, also split by feature area and note it.

Small-repo rule: under about 30 source files or about 10 entry points, skip per-feature splitting and run only the boundaries that exist; list the skipped layers with reasons.

Each agent returns a status per action for ITS boundary only. Merge into one status per action:
1. Broken if any boundary says Broken;
2. else Partially verified if any says Partially verified;
3. else Not auditable from repository evidence if any says so;
4. else Unreachable/dead UI if the inventory shows no reachable handler;
5. else Verified end-to-end only if every boundary says verified.

After merging statuses, merge duplicate TRC- findings (the same break reported by two boundaries becomes one finding, listing every boundary and action) and renumber all TRC- IDs globally, because each boundary agent numbers from TRC-001. Security flaws that agents mention (missing auth, injection) belong to the SEC- findings only; they never change an action's trace status.

## Phase 3 (fresh verifier, most capable model)

Re-check every Critical/High SEC finding, High OPT finding and Broken trace, one `references/agent-verifier.md` agent each (launch together), given only `{{finding_id}}`, `{{claim}}`, `{{evidence}}`. Verdicts: **Confirmed**, **Downgraded** (new severity), **Rejected** (reason). Rejected and downgraded items go to the report appendix, not the findings. Medium/Low findings are not verified: keep them, label "Unverified (not independently re-checked)". If a Broken trace is Rejected, update its action's merged status.

## Deduplicate

A problem spanning areas is reported once under its primary area and cross-referenced by ID elsewhere. Merge the same issue found by two agents into one finding.

## Assemble

Fill `templates/AUDIT_REPORT.template.md` and `templates/AUDIT_TASKS.template.md` (sections in template order; delete the example comment). One task per verified finding (group only when one fix resolves several), ordered by severity/priority then dependency, each with a Fix prompt and `Status: Open`, `Claimed-by:`. Compute Parallel groups from non-overlapping "Files touched".

Tone: the "Start here" section and every "In plain words" line are for a non-specialist (a vibe coder): short sentences, no jargon, say what could go wrong. "Fix these first" lists at most 10 items with task IDs.

## Finish

Tell the user in plain words: the verdict, the top 3 to 5 items and what could go wrong, where the two files are, and any coverage gaps. Offer to start the first parallel group of tasks.
