# product-service — owner: **Por** (Developer)

The **product catalog**: list, search, product detail, admin create/update/delete, and the internal stock endpoint that order-service uses.
Contract: [`docs/API_CONTRACT.md` §1, §2, §4](../docs/API_CONTRACT.md#4-product-service-por--httplocalhost3002)

## Current state (skeleton)
✅ Express app + `/health` · ✅ config from env · ✅ Dockerfile · ✅ Jest + Supertest · ✅ CI workflow `.github/workflows/ci-product.yml`
⏳ All `/api/products` routes answer **501** until you implement them.

## Run it
```bash
docker compose up -d mongo        # from the repo root
cd product-service
cp .env.example .env              # PowerShell: copy .env.example .env
npm install
npm run dev                       # http://localhost:3002/health
npm test
# integration tests:
# bash:       MONGO_URI_TEST=mongodb://127.0.0.1:27017/product_test npm run test:int
# PowerShell: $env:MONGO_URI_TEST="mongodb://127.0.0.1:27017/product_test"; npm run test:int
```
Need an admin token to try admin routes? Run auth-service too (`docker compose up -d auth-service`) and log in as `admin@campusmart.local / Admin@1234`, or sign one in a test with `jsonwebtoken` and the same `JWT_SECRET`.

> ℹ️ The test scripts run Jest with `node --experimental-vm-modules`. **Keep this flag** — MongoDB driver 7 uses dynamic `import()`, which Jest blocks without it, and then every database connection fails with *"Missing required sub-document 'driver' in the client metadata document"*.

## Target structure
```
product-service/src/
├── index.ts  app.ts  config.ts  seed.ts
├── models/Product.ts
├── controllers/product.controller.ts
├── routes/product.routes.ts
├── middleware/ requireAuth.ts · requireAdmin.ts · requireInternalKey.ts
└── utils/ validation.ts · query.ts · stock.ts     # pure functions → unit tests
```

## Your tasks

| ID | Task | Done when |
|---|---|---|
| P1 | `Product` model (fields & rules in contract §4), `toJSON` → `id` | |
| P2 | `GET /api/products` with `search`, `category`, `page`, `limit` → `{ items, total, page, limit }`, sorted by name | TC-PROD-001/002 pass |
| P3 | `GET /api/products/:id` (400 invalid id, 404 not found) | TC-PROD-003 pass |
| P4 | `requireAuth` (verify JWT with `JWT_SECRET`) + `requireAdmin` (403 "Admin only"); `POST`, `PUT`, `DELETE` for admins | TC-PROD-004/005 pass |
| P5 | Seed the 8 products from the contract when the collection is empty and `SEED_PRODUCTS=true` | products visible after `docker compose up` |
| P6 | `PATCH /api/products/:id/stock` protected by header `x-internal-key`, **atomic** update, 409 when stock would go below 0 | order-service can place orders |
| P7 | Unit tests UT-PROD-01..03 | `npm test` green |
| P8 | Integration tests IT-PROD-01..03 | `npm run test:int` green in CI |

Rules: only edit `product-service/`. Keep route order (specific routes before `/:id`). Tell Fluke when P6 is merged and Pound when P2–P4 are merged.

## How to explain it in the presentation
401 vs 403 · why stock uses one atomic `findOneAndUpdate` (two orders at the same time can't oversell) · your CI run · your image `campusmart-product-service` on Docker Hub.

---

## 🤖 AI prompt (Claude Code / Copilot Chat / ChatGPT)

Run your AI tool from the **repo root** (so it can read `docs/`), then paste:

```text
You are working in the CampusMart mono-repo (micro-services, university Software Deployment course).
I am Por and I own ONLY the folder product-service/. Do not modify files outside product-service/.

Read first:
- docs/API_CONTRACT.md sections 1, 2 and 4 (spec for my service — follow EXACTLY: paths, JSON
  fields, status codes, error body { "message": ... }, JWT HS256 with env JWT_SECRET and payload
  { sub, email, name, role }, header x-internal-key for the stock endpoint, seed products)
- docs/TEST_SPEC.md (UT-PROD-01..03, IT-PROD-01..03)
- product-service/README.md (tasks P1–P8, target structure)
- product-service/src/* (keep createApp() in app.ts, /health, config.ts, index.ts)

Implement tasks P1–P8:
1. src/models/Product.ts — name, description, price, stock, category (enum stationery |
   electronics | food | clothing | other), imageUrl, timestamps; toJSON: id = _id string, remove
   _id and __v.
2. src/utils/validation.ts — validateProductInput(body, { partial }) → { ok, value } |
   { ok:false, message }; strict types (reject strings for numbers, non-integer stock).
   src/utils/query.ts — buildProductQuery(query) → { filter, page, limit, skip } with defaults
   page 1, limit 20, max 100, case-insensitive name search with regex special chars escaped.
   src/utils/stock.ts — canApplyStockChange(stock, quantity).
3. Middleware: requireAuth (Bearer JWT → req.user, else 401 "Unauthorized"), requireAdmin
   (403 "Admin only"), requireInternalKey (compare header x-internal-key with
   config.internalApiKey, else 403).
4. Controller + routes replacing the 501 stubs: GET / (public list), GET /:id (400 invalid
   ObjectId, 404 "Product not found"), POST / (admin, 201), PUT /:id (admin, partial),
   DELETE /:id (admin, 200 { message: "Product deleted" }), PATCH /:id/stock (internal key,
   body { quantity: integer }, ATOMIC findOneAndUpdate with { stock: { $gte: -quantity } } and
   $inc, 409 "Insufficient stock").
5. src/seed.ts — insert the 8 products from the contract table when the collection is empty and
   config.seedProducts is true; call from index.ts (replace the TODO).
6. Tests (Jest + Supertest, TypeScript): tests/unit/validation.test.ts, query.test.ts,
   stock.test.ts (UT-PROD-01..03); tests/integration/product.int.test.ts (IT-PROD-01..03) using
   process.env.MONGO_URI_TEST with the describe.skip pattern from tests/integration/db.int.test.ts,
   tokens created with jsonwebtoken.sign and process.env.JWT_SECRET (CI sets it to
   ci-test-secret) — set config/env in the test before importing the app if needed. Keep the
   existing tests passing.

Constraints: TypeScript strict, Express 5, mongoose 9, CommonJS, no `any`, simple readable code with
short comments (I must explain it in a presentation). No new runtime dependencies unless needed.

Finish by running in product-service/: npm run build, npm test, and (with
`docker run -d -p 27017:27017 mongo:7`) MONGO_URI_TEST=mongodb://127.0.0.1:27017/product_test
npm run test:int. Fix until all green. Then summarize each file and give curl examples.
```
