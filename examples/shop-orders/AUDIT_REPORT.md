# Audit Report: shop-orders

Date: 2026-10-20 | Scope: whole repo | Commit: not a git repo

## Start here

**Verdict:** This app is not safe to put online yet. Anyone can look at or cancel anyone else's orders without logging in, and the login box can be tricked with specially typed text. Separately, the Cancel button does not work at all and several screens give the user no feedback.

**Scorecard** (sorted by fix order, address 1 first):

| Fix order | Area | Score /10 | Rating | Why (plain words) | Start with |
|-----------|------|-----------|--------|-------------------|------------|
| 1 | Security | 2.3 | Poor | Anyone can see or cancel anyone's orders; login can be tricked; passwords are plain text. | SEC-001, SEC-002 |
| 2 | Flows | 2.0 | Poor | The Cancel button never works and never saves; three other flows have gaps. | TRC-001, TRC-002 |
| 3 | Reliability & Scale | 5.3 | Needs work | One bad data row can crash the server; the orders list slows down as data grows. | OPT-002, OPT-001 |
| 4 | Tests | 7.5 | Needs work | Nothing automatically checks that the app still works. | TST-001 |
| 5 | Code Health | 9.0 | Fair | The same price code is written three times. | OPT-003 |

**Fix these first** (at most 10):

| # | Task | What could go wrong (plain words) |
|---|------|-----------------------------------|
| 1 | SEC-001 | Anyone can view or cancel any customer's order by changing a number. |
| 2 | SEC-002 | A crafted login entry could let an attacker in without a password once a real database is used. |
| 3 | OPT-002 | One bad data row can crash the whole server for everybody. |
| 4 | TRC-001 | The Cancel order button never cancels anything, and shows no error. |
| 5 | TRC-002 | Cancel never saves to storage, so a real database would forget it. |
| 6 | SEC-003 | Passwords are stored as plain text and login can be guessed at forever. |
| 7 | TST-001 | Nothing automatically checks the app still works after a change. |
| 8 | OPT-001 | The orders list gets slower with every order and item once a real database is used. |

Everything below is the technical detail. You can hand AUDIT_TASKS.md to an AI agent without reading it.

## Architecture summary

Small Node/Express app (CommonJS). `server.js` defines routes (login, products, orders list/detail/cancel) and serves `public/` (vanilla JS: `index.html` + `app.js`, four buttons). `services/orders.js` holds order logic; `db.js` is an in-memory fake database with a regex-based `query(sql, params)`. No auth middleware, sessions, tests, CI, deploy config or external integrations. Not a git repo.

## Coverage gaps and assumptions

- Layers/boundaries skipped and why: route->middleware/auth (no middleware exists; reported under SEC-001); data access->database (no real database or schema, `db.js` is an in-memory fake).
- Tools run (and results) or missing: none installed (npm audit, semgrep, jscpd, knip not available); nothing was installed. No lockfile, so dependency CVEs were not checked. Run `npm install && npm audit` yourself.
- Build/lint/test results: no build step, no lint config, no tests (`npm start` only). Nothing was executed.
- Areas not inspected, and why: real database, hosting, TLS, production data (not in repo).
- Assumptions: `db.js` will be replaced by a real SQL database; SQL-injection impact depends on that.
- Unverified findings: Medium/Low findings are reported as found and labeled "Unverified (not independently re-checked)".

## Security by severity

### Critical

#### SEC-001 No login check on order routes; the caller chooses whose data to see
- Severity: Critical | Confidence: Confirmed | Verification: Confirmed by independent verifier
- Files: server.js:29-32, 34-38, 40-44; services/orders.js:23-33
- Evidence: `const userId = req.query.userId;` (server.js:30) then `orders.listOrders(userId)`; `orders.getOrder(req.params.id)` (server.js:35); `orders.cancelOrder(req.params.id)` (server.js:41). Login (server.js:20) returns `{userId, name}` and issues no session or token; no middleware checks anyone.
- Exploit scenario / impact: a visitor opens `/api/orders?userId=2`, walks `/api/orders/1`, `/2`, and POSTs `/api/orders/2/cancel`. All customers' orders can be read and cancelled.
- Recommended fix: issue a session or signed token at login; require it on `/api/orders*`; take the user id from the session, not the query string; compare `order.user_id` to the session user in the service and return 404 on mismatch.
- Verification: with no credentials `GET /api/orders?userId=1` returns 401; as user 1, `GET /api/orders/2` returns 404 and order 2 stays `open`.
- In plain words: Nobody has to prove who they are. Anyone can type another customer's number into the web address and see or cancel their orders.
- Task: SEC-001

### High

#### SEC-002 Login query is built by gluing user text into SQL
- Severity: High | Confidence: Confirmed that the code builds SQL from input; Needs runtime/config verification for exploitability (the fake `db.js` does not execute SQL) | Verification: Confirmed by independent verifier
- Files: server.js:16-18
- Evidence: `"SELECT id, name FROM users WHERE email = '" + email + "' AND password = '" + password + "'"` with both values from `req.body` (server.js:15).
- Exploit scenario / impact: against a real SQL database, posting `' OR '1'='1` as the email logs in without a password and may expose other data.
- Recommended fix: `db.query('SELECT id, name FROM users WHERE email = ?', [email])`, then compare a password hash in code (see SEC-003); check both inputs are strings.
- Verification: a test that posts `' OR '1'='1` and expects 401, plus a check that no user input appears inside the SQL string.
- In plain words: The login form pastes whatever you type straight into a database command. A sneaky input could trick it into letting someone in.
- Task: SEC-002

### Medium

#### SEC-003 Plain-text passwords and no limit on login guesses (Unverified (not independently re-checked))
- Severity: Medium | Confidence: Confirmed for this code; real storage unknown
- Files: db.js:4, db.js:13, server.js:14-21
- Evidence: `users: [{ id: 1, name: 'Ada', email: 'ada@example.com', password: 'pw1' }]` (db.js:4) and `u.password === m[2]` (db.js:13); no rate limiting anywhere.
- Impact: any data leak exposes every password; an attacker can guess passwords without limit.
- Recommended fix: hash with bcrypt/argon2; add rate limiting or backoff on `/api/login`.
- Verification: stored value is a hash; 6th bad login in a minute returns 429.
- In plain words: Passwords are saved exactly as typed, and nothing stops someone guessing all day.
- Task: SEC-003

### Low

#### SEC-004 Orders are inserted as raw HTML and no security headers are set (Unverified (not independently re-checked))
- Severity: Low | Confidence: Needs runtime/config verification (not exploitable with today's data)
- Files: public/app.js:23-25; server.js:5-7
- Evidence: `.innerHTML = list.map(o => '<li>#' + o.id + ' ' + o.status + ' ' + o.total + '</li>')`.
- Impact: becomes script injection if order fields ever contain user-written text.
- Recommended fix: build list items with `textContent`; add `helmet()` and `app.disable('x-powered-by')`.
- Verification: set a status to `<img src=x onerror=alert(1)>` and confirm it shows as text.
- In plain words: The page pastes server text in as raw page code. Harmless today, risky if users can ever write that text.
- Task: SEC-004

No hardcoded-secret finding: `db.js:1` holds an obvious test placeholder that is never used or sent to a browser. Replace it with an environment variable when a real key is added.

## Optimization by priority

### High priority

#### OPT-002 No error handling in async routes (Reliability)
- Priority: High | Confidence: Confirmed | Verification: Confirmed by independent verifier
- Files: server.js:14, 23, 29, 34, 40; services/orders.js:16
- Evidence and expected benefit (measured, by code reading): `total += rows[0].price_cents * item.qty;` throws if a product is missing; Express 4 (`^4.19.2`) ignores rejected promises from async handlers, there is no error middleware, and on current Node an unhandled rejection stops the process.
- Recommended change: wrap handlers (small `asyncHandler`, or Express 5), add one error middleware that logs and returns 500, guard `rows[0]`.
- Effort: Small | Risk: Low
- Validation: add an order item with `product_id` 99, call `GET /api/orders`; expect a 500 JSON error and the server still running.
- In plain words: One odd data row can take the whole server down for every user until someone restarts it.
- Task: OPT-002

### Medium priority

#### OPT-001 Orders list asks the database one question per order and per item (Scale)
- Priority: Downgraded from High to Medium by the verifier (the fake database has no network delay today) | Confidence: Confirmed pattern, benefit speculative
- Files: services/orders.js:11-16
- Evidence: `const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);` inside the order loop, and `await db.query('SELECT * FROM products WHERE id = ?', [item.product_id]);` inside the item loop.
- Measurement plan: add a fixed 5 ms delay to `db.query`, seed 50 orders x 5 items, time `GET /api/orders`; count queries (about 300 vs 3).
- Recommended change: fetch items for all the user's orders with one `IN (...)`/JOIN query and compute totals in one go.
- Effort: Small | Risk: Low
- Validation: user 1's order 1 total stays `$28.00`; query count per request is constant.
- In plain words: The more orders a customer has, the slower their page gets.
- Task: OPT-001

#### OPT-003 Price formatting copied into three files (Lean)
- Priority: Medium | Confidence: Confirmed | Unverified (not independently re-checked)
- Files: server.js:9-12, services/orders.js:3-6, public/app.js:3-6
- Evidence: identical `function formatPrice(cents) { const dollars = (cents / 100).toFixed(2); return '$' + dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }`; the `public/app.js` copy is never called; `services/orders.js` exports its copy but `server.js` uses its own.
- Recommended change: keep one copy (e.g. `lib/format.js`), import it in server.js and orders.js, delete the unused browser copy.
- Effort: Small | Risk: Low
- Validation: `GET /api/products/1` shows `$12.50`; orders list unchanged.
- In plain words: The same small piece of code is written three times, so a fix has to be made three times.
- Task: OPT-003

#### OPT-005 Orders list returns everything with no paging (Scale)
- Priority: Medium | Confidence: Needs runtime/config verification | Unverified (not independently re-checked)
- Files: services/orders.js:9; server.js:29-32
- Evidence: `const orders = await db.query('SELECT * FROM orders WHERE user_id = ?', [userId]);` with no limit; `SELECT *` used throughout.
- Measurement plan: seed 10,000 orders for one user, record response time and size before/after adding `limit`.
- Recommended change: add `limit`/`offset` with default and max; select needed columns; index `orders.user_id`, `order_items.order_id` when a real database exists.
- Effort: Medium | Risk: Low-Medium (API contract changes)
- Validation: response size capped.
- In plain words: A long-time customer gets every order they ever made in one heavy response.
- Task: OPT-005

#### TST-001 No tests for anything (Tests)
- Priority: High | Confidence: Confirmed | Unverified (not independently re-checked)
- Files: package.json:5 (no test script); whole repo
- Evidence: `"scripts": { "start": "node server.js" }`, no test files.
- Recommended change: add `node:test`; export `app` from server.js separately from `listen`; cover order total (`$28.00`), ownership checks (after SEC-001), cancel, missing-product path, and the cancel URL/method contract.
- Effort: Medium | Risk: Low
- Validation: `npm test` passes and fails when cancel or totals are deliberately broken.
- In plain words: Nothing checks the app still works after a change. The broken Cancel button would have been caught.
- Task: TST-001

### Low priority

#### OPT-006 Hardcoded port, no request logging, unused key export (Reliability)
- Priority: Low | Confidence: Confirmed | Unverified (not independently re-checked)
- Files: server.js:46; db.js:1, 26
- Evidence: `app.listen(3000, ...)`; `API_KEY` exported at db.js:26 but imported nowhere.
- Recommended change: `process.env.PORT || 3000`; basic request logging; remove the unused export.
- Effort: Small | Risk: Low
- In plain words: The server only runs on one fixed address and records almost nothing.
- Task: OPT-006

## Traceability map

- Login: Log in button (index.html:8) -> click handler (app.js:8) -> `POST /api/login` (app.js:9) -> route (server.js:14) -> `db.query` -> `{userId,name}` stored in `currentUser` (app.js:17). Works with correct credentials; user sees nothing either way.
- View orders: button (index.html:9) -> handler (app.js:20) -> `GET /api/orders?userId=` (app.js:21) -> route (server.js:29) -> `listOrders` (services/orders.js:8) -> `db.query` -> list rendered (app.js:23). Works after login.
- Cancel order: button (index.html:10) -> handler (app.js:28) -> `DELETE /api/orders/:id` (app.js:30) -> no matching route (server only has `POST /api/orders/:id/cancel`, server.js:40). Broken.
- Export CSV: button (index.html:11) -> nothing.

### Broken and partial flows

#### TRC-001 Cancel order uses a method and path the server does not have (Broken)
- Action(s): ACT-003, ACT-009 | Confidence: Confirmed | Verification: Confirmed by independent verifier
- Complete call chain: index.html:10 `#cancel-btn` -> app.js:28-30 `await fetch('/api/orders/' + id, { method: 'DELETE' });` -> server.js has only `app.get('/api/orders/:id'` (34) and `app.post('/api/orders/:id/cancel'` (40) -> Express answers 404.
- Exact failing boundary: client request -> server route.
- Expected vs. actual: client expects `DELETE /api/orders/<id>` to cancel; server only cancels via `POST /api/orders/:id/cancel`. The client ignores the response.
- User impact: nothing happens, no error, order stays open.
- Recommended fix: `fetch('/api/orders/' + encodeURIComponent(id) + '/cancel', { method: 'POST' })`, skip when `id` is empty/null, check `res.ok`, show a message and refresh the list.
- In plain words: The Cancel button asks in a way the server does not understand, and the page does not tell the user.
- Task: TRC-001

#### TRC-002 Cancel never writes the change to the database (Broken at service->data; Needs runtime/config verification)
- Action(s): ACT-009 | Verification: Confirmed by independent verifier (line number corrected from db.js:64 to db.js:16)
- Complete call chain: server.js:40-41 -> services/orders.js:28-32 `const order = await getOrder(id); ... order.status = 'cancelled'; return order;` -> only a SELECT is ever issued (services/orders.js:24); db.js `run()` (db.js:10-20) has no UPDATE.
- Expected vs. actual: expected a saved status change; actual only the returned object changes. It appears to stick here only because the fake database returns live references to its rows.
- User impact: with a real database, the API replies "cancelled" but the order is still open on the next read.
- Recommended fix: `UPDATE orders SET status = ? WHERE id = ?`, check the affected row count, only allow cancelling open orders.
- In plain words: Cancel tells you it worked but never saves it.
- Task: TRC-002

#### TRC-003 Export CSV button does nothing (Unreachable/dead UI)
- Action(s): ACT-004 | Confidence: Confirmed | Unverified (not independently re-checked)
- Complete call chain: index.html:11 `<button id="export-btn">Export CSV</button>` -> no listener in app.js, no server route.
- User impact: a visible feature that silently does nothing.
- Recommended fix: build the export (handler + route) or remove the button.
- In plain words: The button is there but connected to nothing.
- Task: TRC-003

#### TRC-004 View orders breaks if you are not logged in and ignores server errors (Partially verified)
- Action(s): ACT-002, ACT-007 | Confidence: Confirmed | Unverified (not independently re-checked)
- Complete call chain: app.js:1 `let currentUser = null;` -> app.js:21 `fetch('/api/orders?userId=' + currentUser.userId)` throws before login; `res.ok` never checked before `list.map` (app.js:23).
- User impact: clicking before logging in silently does nothing; a server error shows a blank list.
- Recommended fix: guard `currentUser` with a "Please log in" message, check `res.ok`, add empty and loading states.
- In plain words: Clicking View orders before logging in quietly breaks the page.
- Task: TRC-004

#### TRC-005 Login shows no result (Partially verified)
- Action(s): ACT-001, ACT-005 | Confidence: Confirmed | Unverified (not independently re-checked)
- Complete call chain: app.js:17 `if (res.ok) currentUser = await res.json();` -> no else branch, no greeting, no error text; a 401 `{error}` (server.js:19) is dropped.
- User impact: wrong and right passwords look the same; double clicks send duplicate requests.
- Recommended fix: show "Signing in...", the name on success and the error on failure; disable the button during the request.
- In plain words: Clicking Log in never tells you whether you got in.
- Task: TRC-005

## Positive findings

- Parameterized queries are used everywhere except login: `server.js:24` (`GET /api/products/:id`) and `services/orders.js:9,12,15,24` use `?` placeholders.
- `GET /api/products/:id` returns only public product fields.
- `express.static('public')` serves only `public/`; `db.js` is not downloadable.
- Body parsing uses the default size limit; no file uploads, no outbound HTTP or shell calls, so no SSRF or command-injection surface.
- Request and response shapes for login and View orders match between client and server.
- The only logging is a non-sensitive startup message.

## Counts

| Area | Critical / High | Medium | Low | Total |
|------|-----------------|--------|-----|-------|
| Security (SEC-) | 2 | 1 | 1 | 4 |
| Optimization (OPT-/TST-), by priority High / Medium / Low | 2 | 3 | 1 | 6 |
| Traceability (TRC-), Broken / Partial / other | 2 Broken | 2 Partial | 1 Dead UI | 5 |

## Appendix: rejected and downgraded findings

| ID | Original claim | Verdict | Reason (standalone) |
|----|----------------|---------|---------------------|
| OPT-001 | N+1 queries in listOrders, High priority | Downgraded(Medium) | The pattern is real (services/orders.js:12 and :15 query inside loops) but the only database is an in-memory fake with no network delay, so the cost today is near zero. |
| TRC (login) | Login action "Broken" at the service->data boundary because of string-built SQL | Rejected(not a broken flow) | With valid credentials the route returns `{userId, name}` and the client stores it (server.js:19-20, app.js:17); the SQL concatenation is a security issue, reported as SEC-002. |
| TRC-002 | Cancel never saves (cited `db.js:64`) | Confirmed with corrected evidence | The claim is true, but `db.js` is only 26 lines; the by-id orders handler is at `db.js:16`. Evidence corrected before it reached this report. |

## Coverage table

| Action ID | Page/Component or entry point | file:line | Status | Finding IDs |
|-----------|-------------------------------|-----------|--------|-------------|
| ACT-001 | Log in button | public/app.js:8 | Partially verified | TRC-005 |
| ACT-002 | View orders button | public/app.js:20 | Partially verified | TRC-004 |
| ACT-003 | Cancel order button | public/app.js:28 | Broken | TRC-001 |
| ACT-004 | Export CSV button | public/index.html:11 | Unreachable/dead UI | TRC-003 |
| ACT-005 | POST /api/login | server.js:14 | Partially verified | SEC-002, SEC-003, TRC-005 |
| ACT-006 | GET /api/products/:id (no UI caller) | server.js:23 | Verified end-to-end | OPT-003 |
| ACT-007 | GET /api/orders | server.js:29 | Partially verified | SEC-001, OPT-001, OPT-002, OPT-005, TRC-004 |
| ACT-008 | GET /api/orders/:id (no UI caller) | server.js:34 | Partially verified | SEC-001 |
| ACT-009 | POST /api/orders/:id/cancel | server.js:40 | Broken | TRC-001, TRC-002, SEC-001 |
