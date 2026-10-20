# Expected audit results for fixture-app

Paths are relative to `tests/fixture-app/`.

## MUST FIND

| # | Prefix | Location | Description |
|---|--------|----------|-------------|
| 1 | SEC- | server.js:34-35 | `GET /api/orders/:id` returns any order without checking the caller owns it (IDOR). |
| 2 | SEC- | server.js:17 | `POST /api/login` builds SQL by string concatenation of email and password (SQL injection). |
| 3 | SEC- | db.js:1 | Hardcoded API key (32-char hex string, `API_KEY` constant) in source. |
| 4 | OPT- | services/orders.js:11-15 (queries at lines 12 and 15) | N+1: one items query per order and one product query per order item (tag `Scale`). |
| 5 | OPT- | server.js:9, services/orders.js:3, public/app.js:3 | Same price-formatting logic copy-pasted in three files (tag `Lean`). |
| 6 | OPT- | server.js:29-32 | `GET /api/orders` has no pagination or limit (tag `Scale`). |
| 7 | TRC- | public/app.js:30 (button at public/app.js:28) vs server.js:40 | Cancel button sends `DELETE /api/orders/:id`, server only defines `POST /api/orders/:id/cancel`. Classification: Broken. |
| 8 | TRC- | public/index.html:11 | "Export CSV" button (`export-btn`) has no handler anywhere. Classification: Unreachable/dead UI. |
| 9 | TST- | package.json (no test script, no test files in the app) | No tests exist for the auth/ownership path (login, order ownership). |

## MUST NOT REPORT

| Location | Why it is not a finding |
|----------|-------------------------|
| server.js:24 | `GET /api/products/:id` uses a parameterized query (decoy next to the unsafe login). Must not be reported as SQL injection, or must appear only in the rejected appendix. |
| server.js:47 | `console.log('Server started on port 3000')` is a non-sensitive startup message. Not a logging-of-secrets finding. |

## TRACE EXPECTATIONS

| Flow | Expected class | Chain |
|------|----------------|-------|
| Login | Verified end-to-end or Partially verified (no user-visible result is a real gap; must not be Broken) | public/index.html:8 `login-btn` -> public/app.js:8 handler -> fetch POST /api/login (public/app.js:9) -> server.js:14 route -> db.query (server.js:16) -> db.js:22 |
| View orders | Verified end-to-end or Partially verified (crash before login is a real gap; must not be Broken) | public/index.html:9 `orders-btn` -> public/app.js:20 handler -> fetch GET /api/orders (public/app.js:21) -> server.js:29 route -> services/orders.js:8 `listOrders` -> db.js:22 |
| Cancel order | Broken | public/app.js:28-30 -> DELETE /api/orders/:id has no matching route (server.js:40 defines POST only) |
| Export CSV | Unreachable/dead UI | public/index.html:11 has no listener |
