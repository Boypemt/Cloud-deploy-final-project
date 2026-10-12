# auth-service — owner: **Bio** (Project Manager)

Handles **register, login and JWT tokens** for CampusMart. Every other service trusts the tokens this service signs.
Contract: [`docs/API_CONTRACT.md` §2–3](../docs/API_CONTRACT.md#2-authentication-jwt--shared-by-all-services)

## Current state (skeleton)
✅ Express app + `/health` · ✅ config from env · ✅ Dockerfile (multi-stage) · ✅ Jest + Supertest set up · ✅ CI workflow `ci-auth.yml`
⏳ Routes `/api/auth/register`, `/login`, `/me` answer **501** until you implement them.

## Run it
```bash
docker compose up -d mongo        # from the repo root
cd auth-service
cp .env.example .env              # PowerShell: copy .env.example .env
npm install
npm run dev                       # http://localhost:3001/health
npm test                          # unit tests
# integration tests (needs the mongo container):
# bash:       MONGO_URI_TEST=mongodb://127.0.0.1:27017/auth_test npm run test:int
# PowerShell: $env:MONGO_URI_TEST="mongodb://127.0.0.1:27017/auth_test"; npm run test:int
```

> ℹ️ The test scripts run Jest with `node --experimental-vm-modules`. **Keep this flag** — MongoDB driver 7 uses dynamic `import()`, which Jest blocks without it, and then every database connection fails with *"Missing required sub-document 'driver' in the client metadata document"*.

## Target structure
```
auth-service/
├── src/
│   ├── index.ts              # connect Mongo, seed users, listen
│   ├── app.ts                # express app (exported for tests)
│   ├── config.ts             # env vars
│   ├── models/User.ts
│   ├── controllers/auth.controller.ts
│   ├── routes/auth.routes.ts
│   ├── middleware/requireAuth.ts
│   ├── seed.ts
│   └── utils/ validation.ts · password.ts · token.ts   # pure functions → unit tests
└── tests/
    ├── unit/                 # UT-AUTH-01..03
    └── integration/          # IT-AUTH-01..02
```

## Your developer tasks

| ID | Task | Done when |
|---|---|---|
| A1 | `User` mongoose model (`name`, `email` unique lower-case, `passwordHash`, `role` user/admin, timestamps) with `toJSON` → `id`, no `_id/__v/passwordHash` | model file + used by controllers |
| A2 | `POST /api/auth/register` (validation, bcrypt hash, 409 duplicate) | matches contract |
| A3 | `POST /api/auth/login` → `{ token, user }`, 401 same message for wrong email/password | matches contract |
| A4 | Seed admin + demo users on start-up (idempotent) | `demo@campusmart.local / Demo@1234` can log in after `docker compose up` |
| A5 | `requireAuth` middleware + `GET /api/auth/me` | 401 without/invalid token |
| A6 | Unit tests UT-AUTH-01..03, integration tests IT-AUTH-01..02 | `npm test` and `npm run test:int` green in CI |

## Your PM tasks (checklist)
- [ ] Create GitHub repo `campusmart`, push this folder structure, add Por/Fluke/Bonus/Pound as collaborators
- [ ] Add secrets `DOCKER_USERNAME`, `DOCKER_PASSWORD`; set Actions workflow permissions to *Read and write* ([PIPELINE.md §4](../docs/PIPELINE.md#4-one-time-setup-pm))
- [ ] Protect `main` (PR + green checks)
- [ ] Publish release **v0.1.0** on the skeleton → check 5 images on Docker Hub (proves the pipeline end-to-end on day 1)
- [ ] Review & merge PRs; keep `docs/API_CONTRACT.md` up to date
- [ ] Track progress (GitHub Projects board or Issues with labels per service)
- [ ] Before submission: fill TEST_SPEC §8 closure table, collect PIPELINE §6 screenshots, release **v1.0.0**
- [ ] Demo: compose / K8s (`deploy/k8s/README.md`) / Azure (DEPLOYMENT_PLAN §6.4)

---

## 🤖 Prompt for Claude Code

Open a terminal **in the repo root**, run `claude`, and paste:

```text
You are working in the CampusMart mono-repo (5 micro-services for a university Software Deployment
course). I am Bio, the PM, and I own ONLY the folder auth-service/. Do not modify any file outside
auth-service/ (read-only for everything else).

First read these files carefully:
- docs/API_CONTRACT.md  (sections 1, 2 and 3 are the spec for my service — follow them EXACTLY:
  paths, JSON field names, status codes, error format { "message": ... }, JWT payload
  { sub, email, name, role }, HS256 with env JWT_SECRET, seed users)
- docs/TEST_SPEC.md     (unit tests UT-AUTH-01..03 and integration tests IT-AUTH-01..02)
- auth-service/README.md (task list A1–A6 and target folder structure)
- auth-service/src/*    (existing skeleton: keep createApp() in app.ts, /health, config.ts, index.ts)

Then implement tasks A1–A6:
1. src/models/User.ts – mongoose model: name, email (unique, lowercase, trimmed), passwordHash,
   role ('user' | 'admin', default 'user'), timestamps. toJSON transform: id = _id string, remove
   _id, __v and passwordHash.
2. src/utils/validation.ts – keep isValidEmail; add validateRegisterInput(body) and
   validateLoginInput(body) returning { ok: true, value } | { ok: false, message }. Reject
   non-string values (prevents NoSQL injection like {"$ne": null}). Rules from the contract.
3. src/utils/password.ts – hashPassword / verifyPassword with bcryptjs (10 rounds).
4. src/utils/token.ts – signToken(user) / verifyToken(token) with jsonwebtoken, config.jwtSecret,
   config.jwtExpiresIn, payload exactly { sub, email, name, role }.
5. src/middleware/requireAuth.ts – reads "Authorization: Bearer <token>", sets req.user, else
   401 { message: "Unauthorized" }. Use a typed Request extension, no `any`.
6. src/controllers/auth.controller.ts + src/routes/auth.routes.ts – register (201 { user }, 400,
   409 "Email already registered"), login (200 { token, user }, 400, 401 "Invalid email or
   password" for both unknown email and wrong password), me (200 { user }, 401, 404).
   Replace the 501 stubs.
7. src/seed.ts – seedUsers(): create admin (config.adminEmail/adminPassword, role admin, name
   "Admin") and demo user (config.demoEmail/demoPassword, role user, name "Demo User") only if
   they don't exist. Call it in index.ts after mongoose.connect (replace the TODO).
8. Tests with Jest + Supertest (TypeScript):
   - tests/unit/validation.test.ts (UT-AUTH-01), tests/unit/password.test.ts (UT-AUTH-02),
     tests/unit/token.test.ts (UT-AUTH-03, include tampered and expired token cases)
   - tests/integration/auth.int.test.ts (IT-AUTH-01 register→login→me, IT-AUTH-02 duplicate 409)
     using process.env.MONGO_URI_TEST and the same describe.skip pattern as
     tests/integration/db.int.test.ts; clean the database after the tests.
   Keep the existing tests passing.

Constraints: TypeScript strict, Express 5, mongoose 9, CommonJS (current tsconfig), no new
runtime dependencies beyond what is in package.json unless really needed. Never log passwords or
tokens. Keep code simple and commented enough for a student to explain it in a presentation.

When done, run inside auth-service/: npm run build, npm test, and if Docker is available
`docker run -d -p 27017:27017 mongo:7` then MONGO_URI_TEST=mongodb://127.0.0.1:27017/auth_test
npm run test:int. Fix everything until green. Finally give me a short summary of what each file
does and a curl example for register, login and me.
```

After it finishes: read the code, run `docker compose up -d --build auth-service`, try the curl commands, then commit on a branch `feature/auth-login` and open a PR.
