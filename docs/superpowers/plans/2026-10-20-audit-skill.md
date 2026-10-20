# `/audit` Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/audit` Claude Code skill and package it in a local git repo `audit-skill`, ready to publish publicly after the user confirms.

**Architecture:** A skill is markdown. `SKILL.md` holds orchestration and shared rules; `references/` holds one prompt per agent; `templates/` holds the two deliverable layouts. "Tests" are a seeded-bug sample app (`tests/fixture-app/`) plus an `expected.md` answer key; the skill passes when a real run on the fixture matches the key.

**Tech Stack:** Markdown only for the skill. Fixture app: small Node/Express + vanilla JS (no install needed to be audited; it is read, not run). Git.

**Spec:** `docs/DESIGN.md` (currently `~/.claude/skills/audit/DESIGN.md`) and verbatim source prompt `skills/audit/references/source-prompt.md`. Where they disagree, the source prompt wins.

## Global Constraints

- Repo is named `audit-skill`, layout `skills/audit/...` so future skills sit beside it as `skills/<name>/`. MIT license. Public only after user confirms (Task 8).
- Skill command is `/audit`; frontmatter `name: audit`.
- Audit is **read-only**: only `AUDIT_REPORT.md` and `AUDIT_TASKS.md` are written, in the audited repo root. Existing `AUDIT_*.md` are never silently overwritten (ask, or write dated names).
- ID prefixes `SEC-`, `OPT-`, `TRC-`, `TST-`. Severities Critical/High/Medium/Low; priorities High/Medium/Low; effort Small/Medium/Large.
- Five trace classes verbatim: Verified end-to-end, Partially verified, Broken, Unreachable/dead UI, Not auditable from repository evidence.
- Confidence labels verbatim: **Confirmed**, **Needs runtime/config verification**. Phase 3 verdicts: **Confirmed**, **Downgraded**, **Rejected**.
- Phase 3 verifies Critical/High security, High optimization, Broken traces; verifier sees only claim + cited evidence.
- Every finding quotes code and cites file:line; has an "In plain words" line; every task ends with a "Fix prompt".
- Optimization tags: `Scale`, `Lean`, `Reliability`, `Tests`.
- No personal data (home paths, emails, tokens) in any published file.
- Orchestration uses the Agent tool; Workflow tool only if the user asks. Phase 0 is done by the main session.

## Review Focus

- Audited repo is tiny or has no UI (CLI/library/API): coverage table lists routes/commands/exports and skips empty layers with a stated reason.
- Audited repo is not a git repo or has no tests/linters: skill still runs, notes missing tools in coverage gaps, installs nothing.
- Zero findings in an area: report says so explicitly and lists what was checked, not padding.
- `AUDIT_REPORT.md` already exists: skill asks or writes a dated filename.
- Decoy code that looks vulnerable but is safe (e.g. parameterized query next to a string-built one): must not be reported, or must land in the rejected appendix.

## File Structure

```
audit-skill/
  README.md
  LICENSE
  docs/DESIGN.md
  docs/superpowers/plans/2026-10-20-audit-skill.md   (this plan)
  skills/audit/
    SKILL.md
    references/source-prompt.md
    references/agent-security.md
    references/agent-optimization.md
    references/agent-inventory.md
    references/agent-trace-boundary.md
    references/agent-verifier.md
    templates/AUDIT_REPORT.template.md
    templates/AUDIT_TASKS.template.md
  tests/fixture-app/...        seeded-bug sample app
  tests/expected.md            answer key
  tests/run-notes.md           results of each verification run
```

---

### Task 1: Repo scaffold and local install

**Files:**
- Create: `~/audit-skill/` (git repo), `LICENSE`, `README.md` (stub), directories above
- Move: `~/.claude/skills/audit/DESIGN.md` → `docs/DESIGN.md`; `references/source-prompt.md` → `skills/audit/references/source-prompt.md`; this plan → `docs/superpowers/plans/2026-10-20-audit-skill.md`

**Interfaces:**
- Produces: repo root `~/audit-skill`; install path `~/.claude/skills/audit` is a symlink to `~/audit-skill/skills/audit`.

- [ ] **Step 1:** `git init ~/audit-skill`; create the directories from File Structure; move the three files with `mv`.
- [ ] **Step 2:** Write `LICENSE` (MIT, copyright holder `ranganc`, year 2026) and a one-paragraph `README.md` stub.
- [ ] **Step 3:** Remove the now-empty `~/.claude/skills/audit` directory and run `ln -s ~/audit-skill/skills/audit ~/.claude/skills/audit`.
- [ ] **Step 4:** Verify: `ls ~/.claude/skills/audit/references/source-prompt.md` succeeds and `git -C ~/audit-skill status` shows the files.
- [ ] **Step 5:** Commit: `git add -A && git commit -m "chore: scaffold audit-skill repo"`.

### Task 2: Seeded-bug fixture and answer key

**Files:**
- Create: `tests/fixture-app/` (Express `server.js`, `db.js`, `services/orders.js`, `public/app.js`, `public/index.html`, `package.json`), `tests/expected.md`

**Interfaces:**
- Produces: `tests/expected.md` with sections `MUST FIND`, `MUST NOT REPORT`, `TRACE EXPECTATIONS`, each item naming file and the seeded line.

- [ ] **Step 1:** Write the app (about 150 lines total) with these seeded items, each tagged only in `expected.md`, never in code comments:
  - `MUST FIND` SEC: `GET /api/orders/:id` returns any order without checking owner (IDOR); `POST /api/login` builds SQL by string concatenation; a hardcoded API key in `db.js`.
  - `MUST FIND` OPT: loop in `services/orders.js` runs one query per order item (N+1); the same price-formatting logic copied in three files; `GET /api/orders` has no pagination.
  - `MUST FIND` TRC: the "Cancel order" button in `public/app.js` sends `DELETE /api/orders/:id` but the server only defines `POST /api/orders/:id/cancel` (Broken); one button wired to nothing (Unreachable/dead UI).
  - `MUST FIND` TST: no test for the auth/ownership path.
  - `MUST NOT REPORT`: `GET /api/products/:id` uses a parameterized query next to the unsafe login one (decoy); a `console.log` of a non-sensitive startup message.
  - `TRACE EXPECTATIONS`: login and "View orders" flows are Verified end-to-end.
- [ ] **Step 2:** Write `tests/expected.md` listing each item with file:line and the expected ID prefix.
- [ ] **Step 3:** Verify: every `MUST FIND` line number in `expected.md` points at the seeded code (`grep -n` each).
- [ ] **Step 4:** Commit: `git add tests && git commit -m "test: add seeded-bug fixture and answer key"`.

### Task 3: Agent prompts

**Files:**
- Create: the five `skills/audit/references/agent-*.md` files

**Interfaces:**
- Consumes: `source-prompt.md` sections Agent 1, Agent 2, Agent 3, Phase 2, Phase 3.
- Produces: each file is a self-contained prompt the orchestrator pastes into an Agent call. Output contracts, exactly:
  - security / optimization agents return a markdown list of findings with the per-finding fields from the source prompt, plus `In plain words:` and (optimization) `Tag:`.
  - inventory agent returns one table with columns `ID | Page/Component | file:line | Trigger | Handler | First call + args | Auth required`, plus an `External navigation` table.
  - trace-boundary agent takes `{boundary, actions[]}` and returns per-action `status` (one of the five classes) and `TRC-` findings with the six fields from the source prompt.
  - verifier takes only `{id, claim, cited evidence}` and returns `Confirmed | Downgraded(new severity) | Rejected(reason)`.

- [ ] **Step 1:** Write each file. Every file opens with the shared rules block: quote the code, cite file:line, fewer well-supported findings, no finding without a concrete failure scenario, mark Confirmed vs Needs runtime/config verification, tool output alone is not a finding, read-only.
- [ ] **Step 2:** Security and optimization files list their checklists verbatim from the source prompt; optimization adds the maintainability tags and the "speculative needs a measurement plan" rule.
- [ ] **Step 3:** Inventory file covers non-UI projects: inventory routes, commands, exported functions, jobs and webhooks when there is no UI, same columns.
- [ ] **Step 4:** Verifier file states it must not be given, and must ignore, any reasoning from the finder.
- [ ] **Step 5:** Verify: `grep -c "file:line" skills/audit/references/agent-*.md` is at least 1 per file, and the five trace class names appear verbatim in `agent-trace-boundary.md`.
- [ ] **Step 6:** Commit: `git commit -am "feat: add agent prompts"` (after `git add`).

### Task 4: Deliverable templates

**Files:**
- Create: `skills/audit/templates/AUDIT_REPORT.template.md`, `AUDIT_TASKS.template.md`

**Interfaces:**
- Produces: report section order, exactly: `Start here` (verdict, "Fix these first" max 10 with task IDs and one-line plain risk) → Architecture summary → Coverage gaps and assumptions → Security by severity → Optimization by priority (grouped by tag) → Traceability map (broken/partial in detail) → Positive findings → Counts table (area × severity/priority) → Appendix (rejected/downgraded) → Coverage table (every action/entry point, status, finding IDs).
- Tasks file: the task block from the source prompt plus `- In plain words:` after the title and a `Fix prompt:` fenced block at the end; then `Parallel groups` and the four sub-agent instructions verbatim.

- [ ] **Step 1:** Write both templates with placeholders in `{{double braces}}`.
- [ ] **Step 2:** Verify: the report template section headings appear in the order above (`grep -n "^## "`), and the tasks template contains `Status: Open` and `Claimed-by:`.
- [ ] **Step 3:** Commit.

### Task 5: SKILL.md orchestration

**Files:**
- Create: `skills/audit/SKILL.md`

**Interfaces:**
- Consumes: Task 3 agent files, Task 4 templates.
- Produces: frontmatter `name: audit`, `description:` triggering on `/audit` and on requests to audit, review the whole codebase, security-check, or find code problems.

- [ ] **Step 1:** Write SKILL.md under about 150 lines with these sections: when to use; hard rules (read-only, evidence, no padding); how to handle args (optional path narrows scope; refuse to overwrite existing `AUDIT_*.md`); Phase 0 checklist done by the main session, including running the build/lint/test commands and noting results; Phase 1 launch three agents in one message using the reference files; Phase 2 one agent per boundary, in parallel, split by feature area over about 50 actions, skip layers that do not exist and say why; Phase 3 fresh verifier with evidence only; deduplication rule; assemble the two files from the templates; finish by telling the user the top items in plain words and offering to start the first parallel group.
- [ ] **Step 2:** Add the small-repo rule: under about 30 source files or about 10 entry points, run only the Phase 2 boundaries that exist.
- [ ] **Step 3:** Verify: every `references/` and `templates/` filename mentioned in SKILL.md exists (`ls` each).
- [ ] **Step 4:** Commit.

### Task 6: Run on the fixture and iterate

**Files:**
- Create: `tests/run-notes.md`
- Modify: any skill file the results show is wrong

- [ ] **Step 1:** Copy `tests/fixture-app` to a scratch directory, `cd` into it and run `/audit` in a fresh Claude Code session.
- [ ] **Step 2:** Compare `AUDIT_REPORT.md` and `AUDIT_TASKS.md` against `tests/expected.md`. Pass means: every `MUST FIND` item is present with correct file:line, no `MUST NOT REPORT` item is reported (or it appears only in the Rejected appendix), the two Broken/dead traces are classified correctly, both login and orders flows are Verified end-to-end, every finding has quoted code, "In plain words" and a Fix prompt, and "Fix these first" has at most 10 items.
- [ ] **Step 3:** Record pass/fail per item in `tests/run-notes.md`. For each failure, edit the responsible prompt or template and rerun until all pass.
- [ ] **Step 4:** Run the Review Focus cases: a scratch repo with no tests and no git; a scratch dir with only a CLI script; a dir already containing `AUDIT_REPORT.md`. Record results.
- [ ] **Step 5:** **Checkpoint:** show the user the generated `AUDIT_REPORT.md` top section and one task; apply their layout feedback to the templates.
- [ ] **Step 6:** Commit.

### Task 7: README and pre-publish scan

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** Write README: what `/audit` does, who it is for, install (`git clone` then symlink or copy `skills/audit` into `~/.claude/skills/audit`), usage, what the two outputs are, how to hand `AUDIT_TASKS.md` tasks to an AI agent, how to add more skills under `skills/`.
- [ ] **Step 2:** Scan: `grep -rniE "rchidamb|ranganc|/home/|@gmail|api[_-]?key|token" . --exclude-dir=.git`. Expected hits only in `LICENSE` (copyright name), the fixture's deliberate fake key (must be an obvious placeholder), and prose. Remove or generalize anything else, including the home path in this plan and `DESIGN.md`.
- [ ] **Step 3:** Commit.

### Task 8: Publish (gated)

- [ ] **Step 1:** Show the user the scan output and `git log --oneline`, and ask for a final yes to create a public repo `audit-skill`. The user already chose the name and MIT; this is the last check before anything leaves the machine.
- [ ] **Step 2:** On yes: create a public repo named `audit-skill` under the user's account with the GitHub CLI or MCP, add the remote, push `main`.
- [ ] **Step 3:** Verify the repo page lists `skills/audit/SKILL.md` and `LICENSE`.
