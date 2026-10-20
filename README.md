# audit-skill

A growing collection of [Claude Code](https://claude.com/claude-code) skills, built for people who build with AI ("vibe coders") and want their projects to stay safe and maintainable.

## `/audit`: full-codebase audit

Reviews a whole repo like a senior engineering and security team and writes two files in the repo root:

- **`AUDIT_REPORT.md`**: a short, plain-language "Start here" (verdict + the top things to fix first), then the full technical detail: security findings, performance and maintainability findings (dead code, duplication, oversized code, N+1 queries, missing tests), a trace of every button or entry point from UI to database, positives, counts, and a coverage table.
- **`AUDIT_TASKS.md`**: one self-contained task per verified finding, each with a ready-to-paste prompt, exact files to touch, acceptance criteria, and groups of tasks that can run in parallel.

How it avoids shallow or invented findings:

- Every finding quotes the code and cites `file:line`; tool output alone is never a finding.
- Parallel agents audit security, optimization and entry points, then one agent per layer boundary traces each action end to end.
- A fresh verifier re-checks every Critical/High security finding, every High optimization finding and every Broken trace using only the cited evidence, and can confirm, downgrade or reject. Rejected items are listed in an appendix.
- The audit is read-only: it never edits your code.

See a real output in [`examples/shop-orders/`](examples/shop-orders/), produced from the test app in [`tests/fixture-app/`](tests/fixture-app/).

### Install

```bash
git clone https://github.com/<your-username>/audit-skill.git
mkdir -p ~/.claude/skills
ln -s "$PWD/audit-skill/skills/audit" ~/.claude/skills/audit   # or copy the folder
```

### Use

Open Claude Code in the project you want checked and run:

```
/audit            # whole repo
/audit src/api    # limit to a folder
```

Then give any task from `AUDIT_TASKS.md` to your AI agent: paste its **Fix prompt**.

### How it is tested

`tests/fixture-app/` is a tiny app with planted problems (missing auth check, SQL injection, hardcoded key, N+1 queries, duplicated code, a broken Cancel button, a dead button, no tests) and two decoys that look unsafe but are not. `tests/expected.md` is the answer key and `tests/run-notes.md` records each run.

## Adding more skills

Each skill lives in its own folder under `skills/<name>/` with a `SKILL.md`.

## License

MIT
