# Team roles & workload split

Assignment roles: **PM**, **Tester**, **Developer** (งานกลุ่ม: วางโครงโปรเจกต์และ Deploy ระบบ).
Rule 5 of the assignment: *one micro-service project per member, each automated up to a released version in a Docker registry* → 5 projects = 5 top-level folders.

| Member | Role | Project folder (owner) | Main work | Workload |
|---|---|---|---|---|
| **Bio** | Project Manager + Developer | `auth-service/` | Login/register/JWT API · deployment plan · pipeline doc · test spec · release workflow · docker-compose · k8s · repo admin & code review · integration | auth code ≈ 6 tasks + PM ≈ 6 tasks |
| **Por** | Developer | `product-service/` | Product catalog API: list/search/paging, admin CRUD, atomic stock endpoint, seed data, 3 UT + 3 IT | ≈ 11 tasks |
| **Fluke** | Developer | `order-service/` | Cart pricing & discount engine, service-to-service calls to product-service with rollback, order history & cancel, 3 UT + 3 IT | ≈ 12 tasks |
| **Bonus** | Developer | `web-frontend/` | React login page (required), register, products, cart, checkout, orders, auth guard; owns nginx gateway config; 3 UT | ≈ 11 tasks |
| **Pound** | Tester | `qa-automation/` | Robot Framework API + UI + security + data-driven tests, `e2e.yml` on CI, bug reports, test closure report, test-runner image | ≈ 11 tasks |

Why this is fair: the PM has the smallest service (3 endpoints) because the PM also owns all documents and the release/integration work. The three developers each get one service with similar size (one DB model + 5–6 endpoints or 5 pages + 3 unit tests). Fluke's service is slightly more logic-heavy (calls another service) while Bonus's has more screens; Por's has admin authorization + atomic stock. The tester gets a full project of their own, which is also released as a Docker image.

## What every member must be able to explain (assignment rule 4)

| Member | Be ready to show & explain |
|---|---|
| Bio | The pipeline diagram (CI → system tests → release → verify), why micro-services/mono-repo/path filters, secrets handling, SemVer releases, how to roll back, JWT login flow, your unit tests |
| Por | Product model & validation, admin-only routes (403 vs 401), why the stock update is atomic, your CI run, your image on Docker Hub |
| Fluke | Pricing & discount unit tests, how order-service calls product-service, what happens if product-service is down (502) or stock runs out (409 + rollback), integration test with a stub |
| Bonus | Login page flow (token in localStorage, redirect, guard), how nginx works as API gateway (path routing), multi-stage Dockerfile (node build → nginx), your Vitest tests |
| Pound | STLC & the test spec traceability (US → TC), Robot tags (Smoke/wip), API vs UI tests, the e2e workflow and its report artifact, a bug you found and reported |
