# Verification runs

## Run 1 (2026-10-20): fixture-app, full pipeline

Setup: scratch copy of `tests/fixture-app`, orchestrated by hand following `SKILL.md` (Phase 0, 3 Phase 1 agents, 4 Phase 2 boundary agents, 7 Phase 3 verifiers on a sample of Critical/High findings and Broken traces).

| Key item | Result |
|----------|--------|
| 1 IDOR (server.js:34-35) | FOUND as SEC-001 (Critical), verified |
| 2 Login SQL injection (server.js:17) | FOUND as SEC-002 (High), verified |
| 3 Hardcoded API key (db.js:1) | MISSED in Run 1: agent judged `sk_test_FIXTURE_NOT_A_REAL_KEY_0000` an obvious placeholder. Fixture flaw; key made realistic, see Run 2 |
| 4 N+1 (services/orders.js:11-15) | FOUND as OPT-001; verifier downgraded High -> Medium (fake db) |
| 5 Price formatter x3 | FOUND as OPT-003 |
| 6 No pagination | FOUND as OPT-005 |
| 7 Cancel DELETE vs POST | FOUND as TRC-001, Broken, verified |
| 8 Export CSV dead button | FOUND as TRC-003, Unreachable/dead UI |
| 9 No tests | FOUND as TST-001 |
| Decoy: parameterized products query | NOT reported (listed under Positive findings) |
| Decoy: startup console.log | NOT reported |
| Login / View orders flows | Partially verified (no feedback; crash before login). Key relaxed to allow this |

Extra real issues found beyond the key: no error handling can crash the server (OPT-002), cancel never persisted (TRC-002), plaintext passwords (SEC-003), View-orders crash before login (TRC-004), login gives no feedback (TRC-005).

Defects in the skill found by this run, and fixes made:
1. Boundary agents cited line numbers past the end of files (db.js is 26 lines; cited db.js:58-70, services/orders.js:56-81). Fix: "Line numbers must come from the file as you read it" rule added to all five agent prompts. The Phase 3 verifier caught and corrected one such citation.
2. A security flaw (SQL injection) was reported as a Broken trace. Verifier rejected it. Fix: trace prompt now says security flaws never change a flow's status.
3. Server routes with no UI caller were labeled Unreachable/dead UI. Fix: calibration section in `agent-trace-boundary.md`.
4. Each boundary agent numbers TRC-001 upward, so IDs collided. Fix: SKILL.md now says to merge duplicates and renumber globally.

## Run 2 (2026-10-20): security agent only, realistic API key

Fixture key changed to a 32-char hex string. Result: FOUND as SEC-005 (Low, "may be a placeholder", Needs runtime/config verification). All 9 MUST FIND items now covered; decoys still not reported (listed under "Verified safe").

## Run 3 (2026-10-20): non-UI project

Inventory agent on a 19-line CLI (`tool.js` with `backup` and `count` commands and two exports). Result: 5 entries (2 commands, usage fallback, 2 exports), noted the missing `require.main` guard and that `package.json` has no `main`. The inventory format works for non-UI projects.

## Not run

- Review Focus cases "not a git repo / no tools" (covered implicitly: the fixture is not a git repo and has no tools) and "existing AUDIT_REPORT.md" (rule is text-only in SKILL.md, untested).
- Phase 3 was run on a sample (SEC-001, SEC-002, OPT-001, OPT-002, three traces), not on every Critical/High item.
- Phase 0 and assembly were done by the main session by hand; there is no automated end-to-end run of `/audit` as a slash command yet.
