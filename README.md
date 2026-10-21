# coding-skills

A growing collection of [Claude Code](https://claude.com/claude-code) skills, built for people who build with AI ("vibe coders") and want their projects to stay safe and maintainable.

## `/audit`: full-codebase audit

Reviews a whole repo like a senior engineering and security team and writes two files in the repo root:

- **`AUDIT_REPORT.md`**: a short, plain-language "Start here" (verdict, a **scorecard**, and the top things to fix first), then the full technical detail: security findings, performance and maintainability findings (dead code, duplication, oversized code, N+1 queries, missing tests), a trace of every button or entry point from UI to database, positives, counts, and a coverage table.
- **`AUDIT_TASKS.md`**: one self-contained task per verified finding, each with a ready-to-paste prompt, exact files to touch, acceptance criteria, and groups of tasks that can run in parallel.

### The scorecard

Five areas are scored out of 10 and given a rating and a fix order, so you know what to address first:

| Fix order | Area | Score /10 | Rating | Why |
|-----------|------|-----------|--------|-----|
| 1 | Security | 2.3 | Poor | Anyone can see or cancel anyone's orders |
| 2 | Flows | 2.0 | Poor | The Cancel button never works or saves |
| 3 | Reliability & Scale | 5.3 | Needs work | One bad data row can crash the server |
| 4 | Tests | 7.5 | Needs work | Nothing checks the app still works |
| 5 | Code Health | 9.0 | Fair | Same code written three times |

The scores are not a judgment call. Each area starts at 10 and verified findings subtract points: Critical 4, High 2.5 (a broken flow counts as High), Medium 1, Low 0.25. Poor is 0 to 4, Needs work 4.1 to 7, Fair 7.1 to 9.5, Good above 9.5. Any Critical finding makes an area Poor, and any High caps it at Needs work.

How it avoids shallow or invented findings:

- Every finding quotes the code and cites `file:line`; tool output alone is never a finding.
- Parallel agents audit security, optimization and entry points, then one agent per layer boundary traces each action end to end.
- A fresh verifier re-checks every Critical/High security finding, every High optimization finding and every Broken trace using only the cited evidence, and can confirm, downgrade or reject. Rejected items are listed in an appendix.
- The audit is read-only: it never edits your code.

See a real output in [`examples/shop-orders/`](examples/shop-orders/), produced from the test app in [`tests/fixture-app/`](tests/fixture-app/).

### Install

```bash
git clone https://github.com/ranganc007/coding-skills.git
mkdir -p ~/.claude/skills
ln -s "$PWD/coding-skills/skills/audit" ~/.claude/skills/audit   # or copy the folder
```

### Use

Open Claude Code in the project you want checked and run:

```
/audit            # whole repo
/audit src/api    # limit to a folder
```

It does not pin a model: the helper agents use whatever model your session uses. Then give any task from `AUDIT_TASKS.md` to your AI agent: paste its **Fix prompt**.

### How it is tested

`tests/fixture-app/` is a tiny app with planted problems (missing auth check, SQL injection, hardcoded key, N+1 queries, duplicated code, a broken Cancel button, a dead button, no tests) and two decoys that look unsafe but are not. `tests/expected.md` is the answer key and `tests/run-notes.md` records each run.

### Update

```bash
git -C path/to/coding-skills pull
```

## Adding more skills

Each skill lives in its own folder under `skills/<name>/` with a `SKILL.md`.

## License

MIT
