# Audit Tasks: shop-orders

Generated 2026-10-20 from AUDIT_REPORT.md. Each task is self-contained: paste its Fix prompt into an AI agent.

### SEC-001 Require login and scope order routes to the signed-in user
- In plain words: Anyone can see or cancel anyone's orders by changing a number. This makes the server check who is asking.
- Category: Security
- Priority/Severity: Critical
- Description & evidence: server.js:30 takes `req.query.userId`; server.js:35 and :41 pass raw ids to `getOrder`/`cancelOrder` (services/orders.js:23-33); no session or middleware exists.
- Files touched: server.js, services/orders.js, public/app.js, tests/orders-auth.test.js
- Acceptance criteria: No credentials -> 401 on /api/orders*; user 1 requesting order 2 gets 404 and order 2 stays open; user id comes from the session, never the query string; client still lists the logged-in user's orders.
- Suggested tests/verification: Two-user test as in acceptance criteria.
- Depends on / blocked by: TST-001 (test harness) if tests are wanted first
- Effort: Medium
- Safe implementation notes: Choose a simple signed cookie/session; this changes the login response and client fetches (send credentials). Existing clients passing `?userId=` stop working.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task SEC-001 in AUDIT_TASKS.md: Require login and scope order routes to the signed-in user.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: server.js, services/orders.js, public/app.js, tests/orders-auth.test.js.
Context: server.js:30 takes `req.query.userId`; server.js:35 and :41 pass raw ids to `getOrder`/`cancelOrder` (services/orders.js:23-33); no session or middleware exists.
Acceptance criteria: No credentials -> 401 on /api/orders*; user 1 requesting order 2 gets 404 and order 2 stays open; user id comes from the session, never the query string; client still lists the logged-in user's orders.
Add or update tests that satisfy the acceptance criteria (Two-user test as in acceptance criteria.).
When finished, set Status: Done with a one-line note.
```

### SEC-002 Make the login query safe
- In plain words: A crafted login entry could let an attacker in without a password. This stops user text being pasted into SQL.
- Category: Security
- Priority/Severity: High
- Description & evidence: server.js:16-18 builds `"... WHERE email = '" + email + "' AND password = '" + password + "'"` from req.body.
- Files touched: server.js, db.js, tests/login.test.js
- Acceptance criteria: Login uses placeholders, never string concatenation; both inputs must be strings (400 otherwise); input `' OR '1'='1` returns 401.
- Suggested tests/verification: Test posting an injection string; grep that no `req.body` value is concatenated into SQL.
- Depends on / blocked by: none (pair with SEC-003)
- Effort: Small
- Safe implementation notes: db.js is a regex fake: add a matching `WHERE email = ?` branch so the new query still works.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task SEC-002 in AUDIT_TASKS.md: Make the login query safe.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: server.js, db.js, tests/login.test.js.
Context: server.js:16-18 builds `"... WHERE email = '" + email + "' AND password = '" + password + "'"` from req.body.
Acceptance criteria: Login uses placeholders, never string concatenation; both inputs must be strings (400 otherwise); input `' OR '1'='1` returns 401.
Add or update tests that satisfy the acceptance criteria (Test posting an injection string; grep that no `req.body` value is concatenated into SQL.).
When finished, set Status: Done with a one-line note.
```

### OPT-002 Stop one bad row from crashing the server
- In plain words: One odd data row can take the whole server down. This makes errors return a clean message instead.
- Category: Optimization
- Priority/Severity: High
- Description & evidence: services/orders.js:16 `rows[0].price_cents` throws on a missing product; async routes in server.js:14,23,29,34,40 have no try/catch or error middleware (Express ^4.19.2).
- Files touched: server.js, services/orders.js, tests/errors.test.js
- Acceptance criteria: A missing product no longer throws; any thrown error returns a 500 JSON body, is logged, and the process keeps running.
- Suggested tests/verification: Add an order item with product_id 99, call GET /api/orders, expect 500 (or skipped item) and server alive.
- Depends on / blocked by: none
- Effort: Small
- Safe implementation notes: Add one `asyncHandler` wrapper and one error middleware; do not change response shapes for working requests.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task OPT-002 in AUDIT_TASKS.md: Stop one bad row from crashing the server.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: server.js, services/orders.js, tests/errors.test.js.
Context: services/orders.js:16 `rows[0].price_cents` throws on a missing product; async routes in server.js:14,23,29,34,40 have no try/catch or error middleware (Express ^4.19.2).
Acceptance criteria: A missing product no longer throws; any thrown error returns a 500 JSON body, is logged, and the process keeps running.
Add or update tests that satisfy the acceptance criteria (Add an order item with product_id 99, call GET /api/orders, expect 500 (or skipped item) and server alive.).
When finished, set Status: Done with a one-line note.
```

### TRC-001 Fix the Cancel order button
- In plain words: The Cancel button asks the server in a way it does not understand. This points it at the right address and shows the result.
- Category: Traceability
- Priority/Severity: Broken
- Description & evidence: public/app.js:30 sends `DELETE /api/orders/<id>`; the server only has `POST /api/orders/:id/cancel` (server.js:40).
- Files touched: public/app.js
- Acceptance criteria: Cancel calls `POST /api/orders/<encoded id>/cancel`, does nothing on empty/cancelled prompt, checks `res.ok`, shows success or failure text, and refreshes the orders list.
- Suggested tests/verification: Manual: log in, cancel order 1, list shows cancelled; unit test for the URL/method if a harness exists.
- Depends on / blocked by: none
- Effort: Small
- Safe implementation notes: Client-only change; do not add a DELETE route.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task TRC-001 in AUDIT_TASKS.md: Fix the Cancel order button.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: public/app.js.
Context: public/app.js:30 sends `DELETE /api/orders/<id>`; the server only has `POST /api/orders/:id/cancel` (server.js:40).
Acceptance criteria: Cancel calls `POST /api/orders/<encoded id>/cancel`, does nothing on empty/cancelled prompt, checks `res.ok`, shows success or failure text, and refreshes the orders list.
Add or update tests that satisfy the acceptance criteria (Manual: log in, cancel order 1, list shows cancelled; unit test for the URL/method if a harness exists.).
When finished, set Status: Done with a one-line note.
```

### TRC-002 Save the cancelled status to the database
- In plain words: Cancel says it worked but never saves. This makes it really store the change.
- Category: Traceability
- Priority/Severity: Broken (Needs runtime/config verification)
- Description & evidence: services/orders.js:28-32 sets `order.status = 'cancelled'` on the returned object; only a SELECT is issued (services/orders.js:24); db.js:10-20 has no UPDATE.
- Files touched: services/orders.js, db.js, tests/cancel.test.js
- Acceptance criteria: `cancelOrder` issues `UPDATE orders SET status = ? WHERE id = ?`, returns 404 for unknown ids, rejects non-open orders, and the status is read back as cancelled.
- Suggested tests/verification: Cancel then GET the order; cancel twice returns an error.
- Depends on / blocked by: none
- Effort: Small
- Safe implementation notes: Add an UPDATE branch to the fake db; keep return shape.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task TRC-002 in AUDIT_TASKS.md: Save the cancelled status to the database.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: services/orders.js, db.js, tests/cancel.test.js.
Context: services/orders.js:28-32 sets `order.status = 'cancelled'` on the returned object; only a SELECT is issued (services/orders.js:24); db.js:10-20 has no UPDATE.
Acceptance criteria: `cancelOrder` issues `UPDATE orders SET status = ? WHERE id = ?`, returns 404 for unknown ids, rejects non-open orders, and the status is read back as cancelled.
Add or update tests that satisfy the acceptance criteria (Cancel then GET the order; cancel twice returns an error.).
When finished, set Status: Done with a one-line note.
```

### SEC-003 Hash passwords and limit login attempts
- In plain words: Passwords are saved as typed and can be guessed forever. This hashes them and slows guessing.
- Category: Security
- Priority/Severity: Medium (Unverified)
- Description & evidence: db.js:4 `password: 'pw1'`; db.js:13 `u.password === m[2]`; no rate limiting.
- Files touched: db.js, server.js, package.json, tests/login.test.js
- Acceptance criteria: Passwords stored as bcrypt/argon2 hashes and verified with the library; 6th bad login in a minute returns 429.
- Suggested tests/verification: Login test with right/wrong password; rate-limit test.
- Depends on / blocked by: SEC-002
- Effort: Medium
- Safe implementation notes: Adds a dependency; existing stored passwords need a one-time migration.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task SEC-003 in AUDIT_TASKS.md: Hash passwords and limit login attempts.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: db.js, server.js, package.json, tests/login.test.js.
Context: db.js:4 `password: 'pw1'`; db.js:13 `u.password === m[2]`; no rate limiting.
Acceptance criteria: Passwords stored as bcrypt/argon2 hashes and verified with the library; 6th bad login in a minute returns 429.
Add or update tests that satisfy the acceptance criteria (Login test with right/wrong password; rate-limit test.).
When finished, set Status: Done with a one-line note.
```

### TST-001 Add automatic tests for the order and login flows
- In plain words: Nothing checks the app still works after a change. This adds basic tests.
- Category: Testing
- Priority/Severity: High (Unverified)
- Description & evidence: package.json:5 has only a `start` script; no test files exist.
- Files touched: package.json, server.js, tests/orders.test.js
- Acceptance criteria: `npm test` runs `node:test`; `server.js` exports `app` separately from `listen`; tests cover order total `$28.00`, cancel, missing product, and the cancel URL/method contract.
- Suggested tests/verification: `npm test` passes, and fails when cancel or totals are deliberately broken.
- Depends on / blocked by: none
- Effort: Medium
- Safe implementation notes: Splitting `listen` from `app` must not change `npm start` behavior.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task TST-001 in AUDIT_TASKS.md: Add automatic tests for the order and login flows.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: package.json, server.js, tests/orders.test.js.
Context: package.json:5 has only a `start` script; no test files exist.
Acceptance criteria: `npm test` runs `node:test`; `server.js` exports `app` separately from `listen`; tests cover order total `$28.00`, cancel, missing product, and the cancel URL/method contract.
Add or update tests that satisfy the acceptance criteria (`npm test` passes, and fails when cancel or totals are deliberately broken.).
When finished, set Status: Done with a one-line note.
```

### OPT-001 Stop asking the database one question per order and item
- In plain words: The orders list gets slower with every order. This fetches everything in a few queries.
- Category: Optimization
- Priority/Severity: Medium
- Description & evidence: services/orders.js:12 and :15 run queries inside nested loops (verified: pattern real, benefit speculative with the fake db).
- Files touched: services/orders.js, db.js
- Acceptance criteria: `listOrders` runs a constant number of queries per request; user 1 order 1 total stays `$28.00`.
- Suggested tests/verification: Count `db.query` calls per request before and after; compare output.
- Depends on / blocked by: OPT-002 (touches same lines)
- Effort: Small
- Safe implementation notes: db.js fake must support the new IN/JOIN query shape.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task OPT-001 in AUDIT_TASKS.md: Stop asking the database one question per order and item.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: services/orders.js, db.js.
Context: services/orders.js:12 and :15 run queries inside nested loops (verified: pattern real, benefit speculative with the fake db).
Acceptance criteria: `listOrders` runs a constant number of queries per request; user 1 order 1 total stays `$28.00`.
Add or update tests that satisfy the acceptance criteria (Count `db.query` calls per request before and after; compare output.).
When finished, set Status: Done with a one-line note.
```

### OPT-003 Keep one copy of the price formatter
- In plain words: The same code is written three times. This keeps one.
- Category: Optimization
- Priority/Severity: Medium (Unverified)
- Description & evidence: formatPrice duplicated at server.js:9-12, services/orders.js:3-6, public/app.js:3-6 (the last is never called).
- Files touched: lib/format.js, server.js, services/orders.js, public/app.js
- Acceptance criteria: One `formatPrice` in lib/format.js used by server.js and services/orders.js; unused browser copy removed; outputs unchanged.
- Suggested tests/verification: `GET /api/products/1` returns `$12.50`.
- Depends on / blocked by: none
- Effort: Small
- Safe implementation notes: Pure refactor.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task OPT-003 in AUDIT_TASKS.md: Keep one copy of the price formatter.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: lib/format.js, server.js, services/orders.js, public/app.js.
Context: formatPrice duplicated at server.js:9-12, services/orders.js:3-6, public/app.js:3-6 (the last is never called).
Acceptance criteria: One `formatPrice` in lib/format.js used by server.js and services/orders.js; unused browser copy removed; outputs unchanged.
Add or update tests that satisfy the acceptance criteria (`GET /api/products/1` returns `$12.50`.).
When finished, set Status: Done with a one-line note.
```

### OPT-005 Page the orders list
- In plain words: A long-time customer gets every order at once. This returns them a page at a time.
- Category: Optimization
- Priority/Severity: Medium (Unverified)
- Description & evidence: services/orders.js:9 selects all orders for a user with no limit.
- Files touched: services/orders.js, server.js
- Acceptance criteria: `GET /api/orders` accepts `limit` and `offset` with defaults and a max; response size capped.
- Suggested tests/verification: Seed many orders; check the cap.
- Depends on / blocked by: OPT-001
- Effort: Medium
- Safe implementation notes: API contract change: UI must page or accept the default.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task OPT-005 in AUDIT_TASKS.md: Page the orders list.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: services/orders.js, server.js.
Context: services/orders.js:9 selects all orders for a user with no limit.
Acceptance criteria: `GET /api/orders` accepts `limit` and `offset` with defaults and a max; response size capped.
Add or update tests that satisfy the acceptance criteria (Seed many orders; check the cap.).
When finished, set Status: Done with a one-line note.
```

### TRC-003 Remove or build the Export CSV button
- In plain words: A button does nothing. This removes it until the feature exists.
- Category: Traceability
- Priority/Severity: Unreachable/dead UI (Unverified)
- Description & evidence: public/index.html:11 has `#export-btn`; no listener in app.js, no server route.
- Files touched: public/index.html
- Acceptance criteria: The dead button is removed (or wired to a working export and route if the owner wants the feature).
- Suggested tests/verification: Load the page; every visible button does something.
- Depends on / blocked by: none
- Effort: Small
- Safe implementation notes: Ask the owner whether the feature is wanted.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task TRC-003 in AUDIT_TASKS.md: Remove or build the Export CSV button.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: public/index.html.
Context: public/index.html:11 has `#export-btn`; no listener in app.js, no server route.
Acceptance criteria: The dead button is removed (or wired to a working export and route if the owner wants the feature).
Add or update tests that satisfy the acceptance criteria (Load the page; every visible button does something.).
When finished, set Status: Done with a one-line note.
```

### TRC-004 Make View orders safe before login and on errors
- In plain words: Clicking View orders before logging in quietly breaks. This shows a message instead.
- Category: Traceability
- Priority/Severity: Partially verified (Unverified)
- Description & evidence: public/app.js:21 `currentUser.userId` throws when `currentUser` is null; `res.ok` unchecked before `list.map` (app.js:23).
- Files touched: public/app.js
- Acceptance criteria: Before login shows "Please log in"; non-ok responses show an error; empty list shows "No orders".
- Suggested tests/verification: Manual: click before login; stop the server and click.
- Depends on / blocked by: TRC-001, TRC-005 (same file; do sequentially)
- Effort: Small
- Safe implementation notes: Client-only.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task TRC-004 in AUDIT_TASKS.md: Make View orders safe before login and on errors.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: public/app.js.
Context: public/app.js:21 `currentUser.userId` throws when `currentUser` is null; `res.ok` unchecked before `list.map` (app.js:23).
Acceptance criteria: Before login shows "Please log in"; non-ok responses show an error; empty list shows "No orders".
Add or update tests that satisfy the acceptance criteria (Manual: click before login; stop the server and click.).
When finished, set Status: Done with a one-line note.
```

### TRC-005 Show login success and failure
- In plain words: Clicking Log in never says whether you got in. This adds a message.
- Category: Traceability
- Priority/Severity: Partially verified (Unverified)
- Description & evidence: public/app.js:17 `if (res.ok) currentUser = await res.json();` with no else and no UI.
- Files touched: public/app.js, public/index.html
- Acceptance criteria: Shows "Signing in...", then the user's name or the server's error; button disabled during the request.
- Suggested tests/verification: Manual: right and wrong password.
- Depends on / blocked by: TRC-004 (same file; do sequentially)
- Effort: Small
- Safe implementation notes: Client-only.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task TRC-005 in AUDIT_TASKS.md: Show login success and failure.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: public/app.js, public/index.html.
Context: public/app.js:17 `if (res.ok) currentUser = await res.json();` with no else and no UI.
Acceptance criteria: Shows "Signing in...", then the user's name or the server's error; button disabled during the request.
Add or update tests that satisfy the acceptance criteria (Manual: right and wrong password.).
When finished, set Status: Done with a one-line note.
```

### SEC-004 Stop inserting server text as raw HTML
- In plain words: The page pastes text in as code. Harmless today, risky later. This makes it plain text.
- Category: Security
- Priority/Severity: Low (Unverified)
- Description & evidence: public/app.js:23-25 `.innerHTML = list.map(...)`; no security headers (server.js:5-7).
- Files touched: public/app.js, server.js, package.json
- Acceptance criteria: List built with `textContent`; `helmet()` added; `x-powered-by` disabled.
- Suggested tests/verification: Set status to an `<img onerror>` string; confirm it shows as text; check headers.
- Depends on / blocked by: TRC-004 (same file)
- Effort: Small
- Safe implementation notes: helmet CSP may block inline script; app.js is external so it is fine.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task SEC-004 in AUDIT_TASKS.md: Stop inserting server text as raw HTML.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: public/app.js, server.js, package.json.
Context: public/app.js:23-25 `.innerHTML = list.map(...)`; no security headers (server.js:5-7).
Acceptance criteria: List built with `textContent`; `helmet()` added; `x-powered-by` disabled.
Add or update tests that satisfy the acceptance criteria (Set status to an `<img onerror>` string; confirm it shows as text; check headers.).
When finished, set Status: Done with a one-line note.
```

### OPT-006 Read the port from the environment and log requests
- In plain words: The server only runs on one address and records little. This makes it configurable.
- Category: Optimization
- Priority/Severity: Low (Unverified)
- Description & evidence: server.js:46 `app.listen(3000, ...)`; db.js:26 exports unused `API_KEY`.
- Files touched: server.js, db.js
- Acceptance criteria: Port from `process.env.PORT` (default 3000); one request log line per request; unused export removed.
- Suggested tests/verification: `PORT=4000 npm start` logs a request line.
- Depends on / blocked by: none
- Effort: Small
- Safe implementation notes: None.
- Status: Open
- Claimed-by:

**Fix prompt:**
```text
Task OPT-006 in AUDIT_TASKS.md: Read the port from the environment and log requests.
Before starting, set its Status to "In progress" and fill Claimed-by.
Only touch these files: server.js, db.js.
Context: server.js:46 `app.listen(3000, ...)`; db.js:26 exports unused `API_KEY`.
Acceptance criteria: Port from `process.env.PORT` (default 3000); one request log line per request; unused export removed.
Add or update tests that satisfy the acceptance criteria (`PORT=4000 npm start` logs a request line.).
When finished, set Status: Done with a one-line note.
```

## Parallel groups

Sets of tasks with no overlapping files that can be worked on concurrently. Run groups in order; most tasks share server.js or public/app.js, so within a group nothing overlaps but across groups it does.

- Group 1: TRC-001 (public/app.js), TRC-002 (services/orders.js, db.js), TRC-003 (public/index.html), TST-001 (package.json, server.js, tests/orders.test.js)
- Group 2: OPT-002 (server.js, services/orders.js), OPT-003 needs server.js/orders.js/app.js so it waits. Run OPT-002 alone with TRC-004 (public/app.js).
- Group 3: SEC-002 (server.js, db.js), TRC-005 (public/app.js, public/index.html)
- Group 4: SEC-001 (server.js, services/orders.js, public/app.js, tests)
- Group 5: SEC-003 (db.js, server.js, package.json), then OPT-001, OPT-005 (services/orders.js) one after another
- Group 6: OPT-003, SEC-004, OPT-006 one after another (all touch server.js)

## Instructions for sub-agents

- Set `Status: In progress` and `Claimed-by:` before starting a task.
- Only touch the listed files.
- Add or update tests that satisfy the acceptance criteria.
- Set `Status: Done` with a one-line note when finished.
