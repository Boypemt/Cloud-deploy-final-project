# qa-automation — owner: **Pound** (Tester)

Automated **system, API, security and end-to-end UI tests** for CampusMart with **Robot Framework** (taught in the *Software Testing* lecture).
They run in GitHub Actions on every push to `main` and every PR (`.github/workflows/e2e.yml`) against the whole system started by docker compose, and again after every release against the images pulled from Docker Hub. This project is also released as a Docker image (`campusmart-qa-automation`) that can test any deployment.

Your inputs from the PM: [`docs/TEST_SPEC.md`](../docs/TEST_SPEC.md) (test cases) and [`docs/API_CONTRACT.md`](../docs/API_CONTRACT.md) (endpoints + UI element ids).

## Current state (skeleton)
✅ Folder structure, shared keywords & variables · ✅ **Smoke tests passing on the skeleton** (TC-HEALTH-001..004, TC-UI-HOME-001) · ✅ examples: TC-LOGIN-001/002 (API), TC-UI-LOGIN-001 (UI), data-driven login from CSV — tagged `wip` until the features are merged · ✅ Dockerfile (Python + Chromium) · ✅ CI workflow `e2e.yml`

```
qa-automation/
├── requirements.txt          # robotframework, requests, selenium, datadriver
├── resources/
│   ├── variables.robot       # BASE_URL, HEADLESS, seed accounts (read from env vars)
│   ├── api_keywords.robot    # Create Gateway Session, Login And Get Token, Auth Headers, Unique Email
│   └── ui_keywords.robot     # Open CampusMart (headless/incognito Chrome), Login Through UI
├── tests/
│   ├── api/00_smoke_health.robot   auth_api.robot   product_api.robot   order_api.robot   login_datadriven.robot
│   └── e2e/web_ui.robot
├── data/login_cases.csv      # rows for the data-driven test
├── run_tests.ps1 / run_tests.sh
└── Dockerfile
```

## Run it on your computer
```bash
# 1) start the system (repo root)
docker compose up -d --build
# 2) one-time Python setup (inside qa-automation/)
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
# 3) run
robot -d results --exclude wip tests            # all ready tests
robot -d results -i Smoke tests                 # only smoke
robot -d results -i US-02 tests                 # one user story
.\run_tests.ps1 -Tag Smoke                      # same, Windows helper
# open results/report.html
```
UI tests use Chrome. To *watch* the browser instead of headless: `$env:HEADLESS="False"` (PowerShell) / `HEADLESS=False` (bash).
Alternative without Python: `docker compose --profile test run --rm qa-automation` (results in `qa-automation/results/`).

## The `wip` tag workflow
A test for a feature that is not merged yet is tagged `wip` → CI skips it (`--exclude wip`). When a developer tells you their feature is merged, remove `wip`, run locally, push. Goal for v1.0.0: **no `wip` left**.

## Your tasks

| ID | Task | Test cases (TEST_SPEC §5) |
|---|---|---|
| Q1 | Set up locally, run the smoke suite, read the report | TC-HEALTH-*, TC-UI-HOME-001 |
| Q2 | Auth API tests (finish `auth_api.robot`) | TC-AUTH-001..003, TC-LOGIN-001..003 |
| Q3 | Security tests | TC-SEC-001, TC-LOGIN-003, TC-PROD-004, TC-ORD-005 |
| Q4 | Product API tests (`product_api.robot`) | TC-PROD-001..005 |
| Q5 | Order API tests (`order_api.robot`) — use `Login And Get Token` + `Auth Headers` | TC-ORD-001..005 |
| Q6 | UI E2E tests (`web_ui.robot`) | TC-UI-LOGIN-001/002, TC-UI-CART-001, TC-UI-LOGOUT-001 |
| Q7 | Data-driven login (remove `wip`, add more CSV rows) | TC-LOGIN-DD |
| Q8 | Keep `e2e.yml` green; add a test-only job input or tag filter if needed | — |
| Q9 | Report every failure as a GitHub Issue (`[TC-ID] ...`, label `bug` + severity) and re-test fixes | — |
| Q10 | Review developers' unit/integration tests in PRs (do they cover TEST_SPEC §3–4?) | UT-*, IT-* |
| Q11 | Fill the test closure table (TEST_SPEC §8) with numbers from the final CI run; keep `report.html` | — |
| Q12 | *(optional)* load test TC-PERF-001 with `npx autocannon` and screenshot the result | TC-PERF-001 |

Rules: only edit `qa-automation/` and `.github/workflows/e2e.yml`. Every test case name starts with its ID from TEST_SPEC and has tags (level, type, `US-xx`).

## How to explain it in the presentation
STLC steps and where they happen in our project · traceability (US → AC → TC id → tag) · API test vs UI test vs unit test · Smoke after release = post-deployment verification · show the `robot-report` artifact from a GitHub Actions run and one bug you reported.

---

## 🤖 AI prompt (Claude Code / Copilot Chat / ChatGPT)

Run your AI tool from the **repo root**, then paste:

```text
You are working in the CampusMart mono-repo (micro-services, university Software Deployment course).
I am Pound, the Tester, and I own ONLY qa-automation/ and .github/workflows/e2e.yml.
Do not modify any other file.

Read first:
- docs/TEST_SPEC.md (section 5 = the test cases I must automate; section 2.5 = tags)
- docs/API_CONTRACT.md (all endpoints, status codes, seed data, and section 6 UI element ids)
- qa-automation/README.md (tasks Q1–Q12) and every file in qa-automation/ (reuse the existing
  keywords in resources/, keep the style of tests/api/00_smoke_health.robot)

Write Robot Framework 7 tests (RequestsLibrary for API, SeleniumLibrary for UI):
1. tests/api/auth_api.robot: TC-AUTH-001..003, TC-LOGIN-001..003, TC-SEC-001 (NoSQL injection
   body {"email": {"$ne": null}, "password": {"$ne": null}} must NOT return 200).
2. tests/api/product_api.robot: TC-PROD-001..005 (admin token via Login And Get Token with
   ADMIN_EMAIL/ADMIN_PASSWORD; delete what you create).
3. tests/api/order_api.robot: TC-ORD-001..005 (find product ids by name from GET /api/products;
   check subtotal/discount/total numbers and that stock changed; cancel restores stock; a freshly
   registered second user gets 404 on the first user's order).
4. tests/e2e/web_ui.robot: TC-UI-LOGIN-001/002, TC-UI-CART-001, TC-UI-LOGOUT-001 using only the
   ids/classes from API_CONTRACT §6, explicit waits (Wait Until ...), no Sleep.
Rules: test names start with the TC id; every test has [Tags] with level (API/UI), type
(Positive/Negative/Security/Smoke/Critical/Regression) and the US-xx id; tests must be independent
(create their own data, use Unique Email); use expected_status=... on every request; put repeated
steps into keywords in resources/. Mark a test with the tag wip ONLY if the feature is not
implemented yet (check by calling the endpoint: 501 means not implemented).

Then run `robot --dryrun -d results tests` to check syntax, and if the stack is running
(docker compose up -d --build at the repo root) run `robot -d results --exclude wip tests` and fix
my tests (not the services) until they reflect the contract. If a service behaves differently from
API_CONTRACT.md, do not change the test to match — list it as a bug for me to report, with the
TC id, expected vs actual.
```
