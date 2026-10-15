# CampusMart — Test Plan & Test Specification

| | |
|---|---|
| Document owner | Bio (Project Manager) |
| Test automation owner | Pound (Tester) |
| Version | 1.0 |
| Follows | STLC from the *Software Testing* lecture: Requirement Analysis → Test Planning → Test Case Design → Environment Setup → Execution → Defect Reporting → Closure |

---

## 1. Requirement analysis — user stories & acceptance criteria

Every test case below traces back to one of these IDs (traceability).

| ID | User story | Acceptance criteria |
|---|---|---|
| **US-01** | As a student I can create an account | AC-01 valid data → account created (201) · AC-02 duplicate email rejected (409) · AC-03 invalid email / short password rejected (400) |
| **US-02** | As a user I can log in and log out | AC-01 correct credentials → token + redirect to products · AC-02 wrong password → error shown, no token · AC-03 protected API without token → 401 · AC-04 logout clears the session |
| **US-03** | As a user I can browse and search products | AC-01 product list shows seeded products · AC-02 search filters by name · AC-03 unknown id → 404 |
| **US-04** | As an admin I can manage products | AC-01 admin can create/update/delete · AC-02 normal user gets 403 |
| **US-05** | As a user I can put products in a cart and place an order with a discount code | AC-01 totals correct (subtotal, discount, total) · AC-02 invalid code rejected · AC-03 insufficient stock rejected (409) · AC-04 stock decreases after order |
| **US-06** | As a user I can see and cancel my orders | AC-01 only my orders are listed · AC-02 cancel PLACED order → CANCELLED and stock restored · AC-03 cannot see other users' orders (404) |
| **US-07** | As the team we can verify a deployment | AC-01 all health endpoints up after deploy · AC-02 deployed version visible on /health |

---

## 2. Test planning

### 2.1 Scope
- **In scope:** functional behaviour of the 4 runtime services through their APIs and the web UI; security basics (auth, authorization, injection); deployment verification (smoke).
- **Out of scope:** real payment, email, mobile apps, load testing above 100 concurrent users (optional extra TC-PERF-001).

### 2.2 Test levels, tools and who does what

| Level | What | Tool | Written by | Runs where |
|---|---|---|---|---|
| Unit (UT) | One pure function | **Jest** (backends), **Vitest** (frontend) | each Developer + PM | `ci-<service>.yml` on every push |
| Integration (IT) | One service + real MongoDB, through HTTP | Jest + **Supertest** + MongoDB service container | each Developer (with Tester review) | `ci-<service>.yml` on every push |
| System / API (TC-*) | Whole stack through the gateway | **Robot Framework + RequestsLibrary** | Tester | `e2e.yml` on push to main & every PR |
| E2E UI (TC-UI-*) | Real browser user flow | **Robot Framework + SeleniumLibrary** (headless Chrome) | Tester | `e2e.yml` |
| Smoke | Build/deploy is alive | Robot tag `Smoke` | Tester | `e2e.yml` + `release.yml` (after publishing images) |
| UAT | Real users try it | Manual checklist (section 6) | whole team + 2 friends | demo day |

### 2.3 Environments
| Env | How | Data |
|---|---|---|
| Dev | `npm run dev` per service + local Mongo container | own test data |
| Test (CI) | GitHub Actions: `docker compose up --build` (MongoDB container) | seed data (section 3 & 4 of API contract) |
| Staging / Release check | GitHub Actions: images **pulled from Docker Hub** (`deploy/docker-compose.release.yml`) | seed data |
| Production / Showcase | Azure Container Apps or Kubernetes + MongoDB Atlas, or local + ngrok | seed data |

### 2.4 Entry & exit criteria
- **Entry:** feature merged to `main`, its service CI is green, endpoint matches `API_CONTRACT.md`.
- **Exit (release allowed):** 100% of UT/IT pass, 100% of `Smoke` + `Critical` Robot tests pass, ≥ 90% of all Robot tests pass, no open Critical defect.

### 2.5 Tags used in Robot Framework
`Smoke` · `Critical` · `Positive` · `Negative` · `Security` · `Regression` · `API` · `UI` · requirement id (`US-01` …) · `wip` (= feature not ready, excluded from CI).
Run only smoke: `robot -d results -i Smoke tests` · run US-05 only: `robot -d results -i US-05 tests`.

---

## 3. Unit test specification (≥ 5 required — we have 12)

> The assignment requires **at least as many unit tests as members (5)**. Each developer owns 3, the PM owns the auth ones. Example tests already in the skeleton (`health`, `isValidEmail`, `isNonNegativeNumber`, `roundMoney`, `formatPrice`) are extra.

| ID | Service / file | Function under test | Cases (input → expected) | Owner |
|---|---|---|---|---|
| **UT-AUTH-01** | auth `src/utils/validation.ts` | `validateRegisterInput(body)` | valid → `{ ok: true }`; missing name → error; bad email → error; password `"123"` → error; email object `{ "$ne": null }` → error | Bio |
| **UT-AUTH-02** | auth `src/utils/password.ts` | `hashPassword` / `verifyPassword` | hash ≠ plain text; verify(correct) → true; verify(wrong) → false | Bio |
| **UT-AUTH-03** | auth `src/utils/token.ts` | `signToken(user)` / `verifyToken(token)` | payload has `sub,email,name,role`; tampered token → throws; expired token → throws | Bio |
| **UT-PROD-01** | product `src/utils/validation.ts` | `validateProductInput(body, { partial })` | valid → ok; price `-1` → error; stock `1.5` → error; unknown category → error; partial update with only `price` → ok | Por |
| **UT-PROD-02** | product `src/utils/query.ts` | `buildProductQuery(query)` | `{}` → page 1 limit 20; `limit=500` → 100; `search="pen"` → case-insensitive regex; regex special chars are escaped | Por |
| **UT-PROD-03** | product `src/utils/stock.ts` | `canApplyStockChange(stock, quantity)` | (10,-3) → true; (2,-3) → false; (0,+5) → true; non-integer → false | Por |
| **UT-ORD-01** | order `src/utils/pricing.ts` | `calculateSubtotal(items)` | 2×45 + 1×35 → 125; empty → 0; `0.1×3` style floats rounded | Fluke |
| **UT-ORD-02** | order `src/utils/pricing.ts` | `applyDiscount(subtotal, code)` | (100,"WELCOME10") → 10; (300,"CAMPUS50") → 50; (299,"CAMPUS50") → error; (100,"welcome10") → 10; (100,"FAKE") → error; (null code) → 0 | Fluke |
| **UT-ORD-03** | order `src/utils/pricing.ts` | `mergeItems(items)` + `calculateTotals(...)` | duplicate productIds merged; total = subtotal − discount; total never < 0 | Fluke |
| **UT-WEB-01** | web `src/utils/validation.ts` | `validateLoginForm({email,password})` | empty email → error; bad email → error; empty password → error; valid → no errors | Bonus |
| **UT-WEB-02** | web `src/utils/cart.ts` | `addToCart` / `removeFromCart` / `updateQuantity` | add new → length+1; add same → quantity+1; quantity 0 → removed | Bonus |
| **UT-WEB-03** | web `src/utils/cart.ts` | `cartCount(cart)` / `toOrderItems(cart)` | count = Σ quantity; maps to `{productId, quantity}` | Bonus |

## 4. Integration test specification (service + real MongoDB)

| ID | Service | Scenario | Expected | Owner |
|---|---|---|---|---|
| **IT-AUTH-01** | auth | register → login → `/me` with token | 201 → 200 + token → 200 same email | Bio |
| **IT-AUTH-02** | auth | register same email twice | second call 409 | Bio |
| **IT-PROD-01** | product | admin token: create → get → update → delete | 201 → 200 → 200 → 200, then get → 404 | Por |
| **IT-PROD-02** | product | user token: create product | 403 | Por |
| **IT-PROD-03** | product | stock PATCH with/without internal key, and below zero | 200 / 403 / 409 | Por |
| **IT-ORD-01** | order | create order while product-service is replaced by a stub (small Express app or `nock`) | 201, totals correct, stub received stock PATCH | Fluke |
| **IT-ORD-02** | order | product-service stub down | 502 "Product service unavailable" | Fluke |
| **IT-ORD-03** | order | user B requests user A's order | 404 | Fluke |

Tokens for IT tests are created with `jsonwebtoken.sign(...)` using the test `JWT_SECRET` — no need to run auth-service.

---

## 5. System, API & E2E test cases (Robot Framework — automated by Pound)

Format follows the lecture's test case table (ID · description · Req/AC · expected · status). Status is filled from the latest CI run.

| Test Case ID | Description | Req / AC | Level | Pre-condition | Steps & test data | Expected result | Tags | Status |
|---|---|---|---|---|---|---|---|---|
| TC-HEALTH-001 | Gateway is up | US-07 AC-01 | System | Stack running | GET `/health` | 200, `status=ok` | Smoke API | Pass |
| TC-HEALTH-002..004 | Auth / product / order healthy | US-07 AC-01 | System | Stack running | GET `/health/auth`, `/health/product`, `/health/order` | 200, correct `service`, `db=up` | Smoke API | Pass |
| TC-UI-HOME-001 | Web app loads | US-07 | E2E | Stack running | open `/login` | title = `CampusMart` | Smoke UI | Pass |
| TC-AUTH-001 | Register with valid data | US-01 AC-01 | API | — | POST `/api/auth/register` unique email, password `secret123` | 201, `user.email` = input, no `password` field | API Positive | Pass |
| TC-AUTH-002 | Register duplicate email | US-01 AC-02 | API | TC-AUTH-001 user exists | same body again | 409 + message | API Negative | Pass |
| TC-AUTH-003 | Register invalid input | US-01 AC-03 | API | — | email `abc`, password `123` | 400 + message | API Negative | Pass |
| TC-LOGIN-001 | Login valid credentials | US-02 AC-01 | API | seed demo user | POST `/api/auth/login` demo / `Demo@1234` | 200, has `token`, `user.email` | API Smoke Critical | Pass |
| TC-LOGIN-002 | Login wrong password | US-02 AC-02 | API | seed demo user | demo / `wrong-password` | 401 + message | API Negative | Pass |
| TC-LOGIN-003 | Protected endpoint without token | US-02 AC-03 | API | — | GET `/api/auth/me` no header; then with `Bearer abc` | 401 both | API Security | Pass |
| TC-LOGIN-DD | Data-driven login (CSV) | US-02 | API | seed | rows in `data/login_cases.csv` | status per row | API Regression | Pass (8 rows) |
| TC-SEC-001 | NoSQL injection on login | US-02 | API | — | body `{"email":{"$ne":null},"password":{"$ne":null}}` | NOT 200 (expect 400) | API Security | Pass |
| TC-PROD-001 | List products | US-03 AC-01 | API | seed products | GET `/api/products` | 200, `total ≥ 8`, contains "CMU Notebook A5" | API Smoke | Pass |
| TC-PROD-002 | Search products | US-03 AC-02 | API | seed | GET `/api/products?search=notebook` | every item name contains "notebook" (any case) | API | Pass |
| TC-PROD-003 | Unknown product id | US-03 AC-03 | API | — | GET `/api/products/000000000000000000000000` | 404 | API Negative | Pass |
| TC-PROD-004 | Normal user cannot create product | US-04 AC-02 | API | demo token | POST `/api/products` | 403 | API Security | Pass |
| TC-PROD-005 | Admin creates & deletes product | US-04 AC-01 | API | admin token | POST then DELETE | 201 then 200 | API Positive | Pass |
| TC-ORD-001 | Order with WELCOME10 | US-05 AC-01, AC-04 | API | demo token, product "CMU Notebook A5" (45) | POST `/api/orders` 2 × notebook, code `WELCOME10`; cancel it again at the end | 201, subtotal 90, discount 9, total 81; product stock −2 | API Critical | Pass |
| TC-ORD-002 | Invalid discount code | US-05 AC-02 | API | demo token | quote with code `FAKE` | 400 "Invalid discount code" | API Negative | Pass |
| TC-ORD-003 | Insufficient stock | US-05 AC-03 | API | "Limited Edition Mug" stock 2 | order quantity 5 | 409 | API Negative | Pass |
| TC-ORD-004 | Cancel order restores stock | US-06 AC-02 | API | demo token (places its own order, independent of TC-ORD-001) | POST `/api/orders` 2 × notebook, then PATCH `/api/orders/:id/cancel` | 200, status CANCELLED, stock back +2 | API | Pass |
| TC-ORD-005 | Cannot read another user's order | US-06 AC-03 | API | order of demo; new user token | GET `/api/orders/:id` as new user; cancel the order at the end | 404 | API Security | Pass |
| TC-ORD-006 | Blank discount code means no discount | US-05 AC-01 | API | demo token, product "Blue Gel Pen (3-pack)" (35) | POST `/api/orders` 1 × pen with `discountCode: ""`; cancel it again at the end | 201, discount 0, `discountCode` null, total = subtotal | API Positive Regression | Pass |
| TC-UI-LOGIN-001 | Login through UI | US-02 AC-01 | E2E | seed | type demo creds in `#login-email/#login-password`, click `#login-submit` | URL `/products`, `#product-list` visible, `#nav-user` contains "Demo" | UI Smoke Critical | Pass |
| TC-UI-LOGIN-002 | Wrong password in UI | US-02 AC-02 | E2E | seed | wrong password | `#login-error` visible, still on `/login` | UI Negative | Pass |
| TC-UI-CART-001 | Add to cart and checkout | US-05 | E2E | logged in | add "Blue Gel Pen (3-pack)" → `/cart` → code `WELCOME10` → `#apply-discount` → `#checkout-button`; cancel the order through the API at the end | `#cart-discount` non-zero, `#order-success` visible; `.order-row` appears in `/orders` | UI Critical | Pass |
| TC-UI-LOGOUT-001 | Logout | US-02 AC-04 | E2E | logged in | click `#nav-logout`, open `/products` | redirected to `/login` | UI | Pass |
| TC-PERF-001 *(optional)* | 100 users for 30 s | non-functional | Performance | stack running | `npx autocannon -c 100 -d 30 http://localhost:8080/api/products` | no errors, p99 < 1 s | Perf | |

---

## 6. UAT checklist (manual, on demo day)

| # | Task for the user | Pass? |
|---|---|---|
| 1 | Create an account and log in | |
| 2 | Find "hoodie" with the search box | |
| 3 | Put 2 items in the cart, use code WELCOME10, place the order | |
| 4 | See the order in "My orders" and cancel it | |
| 5 | Log out — the products page is no longer reachable | |

## 7. Defect reporting
Bugs are GitHub **Issues** with label `bug` + severity label (`critical` / `major` / `minor`). Title format: `[TC-ORD-001] total is 90 instead of 81`. Include: steps, expected, actual, CI run link / Robot `log.html` screenshot. The developer who owns the service fixes it in a branch `fix/<issue-number>-short-name`; the tester re-runs and closes.

## 8. Test closure

Final results for release **v1.0.0** (all 5 projects merged, full stack started with `docker compose up --build`).

### 8.1 Summary

| Metric | Value |
|---|---|
| Total automated tests | **212** = 150 unit + 27 integration + 35 system/E2E |
| Executed | 212 (100%) |
| Pass / Fail / Blocked | **212 / 0 / 0** |
| Unit tests (Jest + Vitest) passing | 150 / 150 |
| Robot Framework suite | 35 / 35 passed — run twice in a row on the same database, both 100% green (repeatable); stock returned to its seed values after each run |
| `wip` tests left | 0 |
| Defects raised / closed / open | **8 / 8 / 0** (+1 known limitation, accepted — see 8.4) |
| Exit criteria (§2.4) | ✅ 100% UT/IT pass · ✅ 100% Smoke + Critical pass · ✅ 100% of Robot tests pass · ✅ no open Critical defect → **release approved** |

### 8.2 Results by test level and project

| Level | Tool | auth-service | product-service | order-service | web-frontend | Total | Result |
|---|---|---|---|---|---|---|---|
| Unit (UT) | Jest / Vitest | 54 | 52 | 17 | 27 | **150** | all pass |
| Integration (IT, real MongoDB) | Jest + Supertest | 12 | 8 | 7 | — | **27** | all pass |
| System / API / E2E | Robot Framework | — | — | — | — | **35** | all pass |

Robot Framework results by tag (one test can have several tags):

| Tag | Pass | | Tag | Pass |
|---|---|---|---|---|
| API | 30 | | US-01 Register | 3 |
| UI (browser E2E) | 5 | | US-02 Login / logout | 15 |
| Smoke | 8 | | US-03 Browse products | 3 |
| Critical | 4 | | US-04 Admin products | 2 |
| Security | 4 | | US-05 Cart & order | 5 |
| Positive | 11 | | US-06 Order history / cancel | 2 |
| Negative | 7 | | US-07 Deployment check | 5 |
| Regression | 9 | | **Fail** | **0** |

Every user story US-01…US-07 is covered by at least 2 passing test cases (traceability, §1).

### 8.3 Defects found and fixed

| ID | Found by / in | Severity | Description | Fix | Status |
|---|---|---|---|---|---|
| D-01 | CI · auth, product, order | Critical | Every integration test failed in GitHub Actions: `Missing required sub-document 'driver' in the client metadata document`. MongoDB driver 7 uses dynamic `import()`, which Jest's sandbox blocks, so the driver sent an empty handshake that MongoDB rejected | Run Jest with `node --experimental-vm-modules` in the test scripts; CI also waits for a healthy MongoDB and uses `127.0.0.1` | Closed |
| D-02 | Review · product-service | Minor | A malformed JSON body returned 500 instead of 400 | `entity.parse.failed` → `400 Invalid JSON body` | Closed |
| D-03 | Review · order-service | Major | A blank discount code (`""`, sent by an empty discount box) was rejected with 400, so checkout without a code would fail | Blank code = no discount; covered by TC-ORD-006 | Closed |
| D-04 | Review · order-service | Minor | A malformed JSON body returned 500 instead of 400 | Same fix as D-02 | Closed |
| D-05 | Review · order-service | Major | If saving an order failed after stock was reserved, the stock was never given back | Roll back every reserved item, then return the original error; integration test added | Closed |
| D-06 | Review · order-service | Major | Cancelling could restore only part of the stock if product-service failed halfway | All-or-nothing: order stays `PLACED`, `502`, cancel can be retried safely; integration test added | Closed |
| D-07 | Local run · docker compose | Minor (environment) | Stack would not start when another MongoDB container already used port 27017; a half-started stack then failed with `ENOTFOUND mongo` | Documented in the README: stop the other container, `docker compose down --remove-orphans`, `up` again | Closed |
| D-08 | Robot · E2E (test side) | Minor | TC-UI-CART-001 clicked at a stale position because of smooth scrolling and the product-card hover animation | Reusable keyword `Click Element When Still` (instant scroll + retry); no product code change needed | Closed |

### 8.4 Known limitation (accepted for v1.0.0)
If a product is **deleted** while an order containing it is still `PLACED`, cancelling that order returns `502` and the order stays `PLACED` (the stock cannot be put back on a product that no longer exists). Chosen on purpose: keeping the order consistent is safer than silently losing stock. Rare in practice; would be handled by an admin in a later version.

### 8.5 Lessons learned
1. **One shared API contract** (`docs/API_CONTRACT.md`) let 4 people build 4 services in parallel; all services worked together the first time they ran in one stack.
2. **Integration tests against a real database find problems unit tests cannot** — D-01 only appeared with a real MongoDB in CI.
3. **Tag-based test status (`wip`)** let the tester write every test early and switch them on as features were merged, without ever breaking CI.
4. **Small PRs + required CI + review** caught D-02…D-06 before they reached `main`.
5. **Post-release smoke tests on the published images** prove the artifact on Docker Hub works, not just the source code.
6. Environment issues (ports, line endings, leftover containers) cost more time than code bugs — documenting the fix in the README saved the rest of the team from repeating them.
