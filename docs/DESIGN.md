# `/audit` skill: design

Date: 2026-10-20

## Intent and why

A Claude Code skill, `/audit`, that reviews a whole codebase and produces (1) a report a non-specialist can read and (2) a task backlog an AI coding agent can execute.

Why it exists: the author's past audits were **shallow and contained invented findings**, and the reports were **too complex to act on**. The main readers are **vibe coders** (people building with AI who are not security or architecture specialists). After reading, they should be able to hand tasks to an AI agent and have the issues fixed. Vibe-coded projects also tend to become hard to maintain, so the audit must treat **future maintainability, efficiency, lean code and scalability** as first-class concerns alongside security.

Source material: the author's pasted "Full Codebase Audit" prompt (Phase 0 discovery, Phase 1 parallel agents for security / optimization / entry-point inventory, Phase 2 per-boundary traceability, Phase 3 independent verification, two deliverables). The user confirmed that **all of that detail stays**. This design wraps it, it does not shrink it.

## Goals

- Real findings only: every finding cites file:line and quotes the relevant code. Nothing is reported on tool output or a hunch alone.
- Serious findings are independently re-checked by a fresh agent; failures are dropped or downgraded, with rejects listed in an appendix.
- Report has two layers: a short plain-language top section, then the full technical detail, traceability map and per-UI-action coverage table underneath.
- Every task in the backlog can be pasted to an AI agent as-is and be understood without the report (self-contained, exact files, acceptance criteria).
- Maintainability and scalability findings (duplication, oversized or tangled code, dead code, N+1 and unbounded queries, missing indexes, no pagination, missing tests around risky behavior) are covered at the same rigor as security.
- Read-only: the audit never edits production code. It writes only `AUDIT_REPORT.md` and `AUDIT_TASKS.md` in the repo root.
- Publishable: the skill is self-contained and generic, so anyone can install it from a public GitHub repo.

## Non-goals

- Fixing anything. The skill produces the backlog; the user (or a later agent run) executes it.
- Replacing a human pentest or compliance audit. The report says what was and was not covered.
- Speculative micro-optimizations without evidence or a measurement plan.

## Anti-goals (a failure even if it technically runs)

- Long lists of generic "best practice" nits padding the count.
- Findings that cannot be traced to a specific line.
- Jargon in the summary section ("IDOR" without a plain explanation).
- Dumping the whole technical detail at the top where a beginner has to wade through it.
- Anything user-specific (paths, emails, usernames) baked into the published skill.

## Decisions made with the user

- Installs as a **personal skill available in every project**: `~/.claude/skills/audit/`.
- Keep all original phases and deliverables, including the full traceability coverage table.
- Four-point shape agreed: purpose (fixes handed to AI), reader (plain language, short top), trust (cited evidence + independent verification), maintainability scope.
- **Publish in a public GitHub repo under the user's own account** (stated mid-conversation; details below are still open).

## Publishing (user wants it public; specifics are my calls until confirmed)

- Repo contents: `SKILL.md`, `references/`, `templates/`, `README.md` (what it does, install via copy or clone into `~/.claude/skills/audit`, example output, how to use the generated tasks with an AI agent), `LICENSE`.
- The repo is the skill folder itself, so cloning it into `~/.claude/skills/audit` is the install.
- Suggested repo name `claude-audit-skill`, MIT license. **Nothing is created or pushed until the user confirms name, license and visibility.** Creating a public repo and pushing is outward-facing.
- Before any push: scan the files for personal data (home paths, email, tokens).
- Development is done in a local git repo at `~/.claude/skills/audit`; DESIGN.md can ship in the repo or be left out (user's choice).

## My calls (not yet confirmed by the user)

1. **Files:** `SKILL.md` (orchestration, rules, short) plus `references/` with one file per agent prompt (security, optimization, entry-point inventory, traceability boundary, verifier) and `templates/` for the two deliverables.
2. **Report layout:** `AUDIT_REPORT.md` opens with "Start here": verdict in 2-3 sentences, a "Fix these first" list of at most 10 items, each with a one-line plain-English "what could go wrong" and its task ID. Then the technical report, traceability map, positives, counts table, appendix and coverage table.
3. **Plain-words field:** every finding and task has an "In plain words" line (one or two sentences, no jargon).
4. **Copy-paste prompt per task:** each task in `AUDIT_TASKS.md` ends with a ready-to-paste "Fix prompt" for an AI agent, on top of the format in the source prompt.
5. **Maintainability framing:** optimization findings are tagged `Scale`, `Lean` (dead/duplicated/oversized), `Reliability`, or `Tests`. Prefix scheme unchanged (SEC-, OPT-, TRC-, TST-).
6. **Orchestration:** Agent tool, Phase 1 agents in parallel, Phase 2 boundary agents in parallel (batched if many). Workflow tool only if the user asks. Phase 0 is done by the main session.
7. **Scaling to repo size:** for small projects (under ~30 source files or ~10 UI actions) skip per-feature splitting and run Phase 2 agents only for layers that exist. The report states which layers were skipped and why.
8. **Invocation:** `/audit` audits the whole repo; an optional path argument narrows scope and the report states it. Existing `AUDIT_*.md` files are never overwritten silently: ask first or write a dated name.
9. **Tools:** run dependency audit, dead-code, duplication and static analysis tools when installed; if missing, note it in coverage gaps rather than installing.
10. **Verification input:** the Phase 3 verifier gets only the claim and cited file:line evidence, never the originating agent's reasoning.
11. **Hygiene rules in every agent prompt:** quote the code; fewer well-supported findings; mark Confirmed vs Needs runtime/config verification; no finding without a concrete failure scenario.

## Constraints

- Works on any language or framework; Phase 0 picks the layers.
- Source prompt rules carry over: ID prefixes, severity definitions, priority/effort/risk fields, five trace classifications, dedup rule (report once, cross-reference).
- SKILL.md frontmatter description must trigger on `/audit` and on audit/review requests.

## Left to the builder

- Exact wording of each agent prompt, provided it carries the rules above.
- Exact markdown layout of the templates and README.
- How to batch Phase 2 agents when there are many actions.
- Whether to ship a small example report.

## Answers to builder-check questions

- **Source prompt:** saved verbatim at `references/source-prompt.md`. It defines the severity scale, the five trace classifications, the ID prefixes, the task schema, the Phase 3 verification scope (Critical/High security, High optimization, Broken traces) and the coverage table. It is authoritative; where this design and the source prompt disagree, the design's additions (plain-words line, fix prompt, tags, two-layer report) are layered on top, never replacing source rules.
- **Non-UI projects:** the "entry point" unit generalizes beyond buttons. For CLIs, libraries, APIs and backends, Agent 3 inventories routes, commands, exported public functions, jobs and webhooks, and the coverage table lists those instead of UI actions.
- **Status of "My calls":** provisional until the user approves this document. The plan should treat templates as the part most likely to change and include a review checkpoint after the first sample report is generated.
- **Scope of the build:** ends with a local git repo (skill files, README, LICENSE, personal-data scan). Pushing to GitHub is a separate final step that only happens after the user confirms name, license and public visibility. DESIGN.md ships in the repo unless the user says otherwise.
- **Acceptance testing:** build a small sample repo with seeded issues (a missing auth check, an N+1 query, duplicated logic, a broken client/server contract, a decoy that looks vulnerable but isn't). Done means the audit finds the seeded real issues, rejects or never reports the decoy, and produces both deliverables in the agreed layout. The user may supply a real project instead.
- **Phase 3 scope:** per the source prompt, verify Critical/High security findings, High optimization findings and Broken traces. Medium and Low are reported as found, marked unverified.
- **Large repos:** backlog ordered by severity/priority then dependency (per the source prompt); "Fix these first" is a highlight list of at most 10, not the only ordering.
