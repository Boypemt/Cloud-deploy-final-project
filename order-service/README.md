# order-service — owner: **Fluke** (Developer)

The **cart pricing, discount codes and orders**. It is the service that talks to another service: it asks product-service for real prices/stock and reserves stock when an order is placed.
Contract: [`docs/API_CONTRACT.md` §1, §2, §5](../docs/API_CONTRACT.md#5-order-service-bonus--httplocalhost3003)

## Current state (skeleton)
✅ Express app + `/health` · ✅ config (`PRODUCT_SERVICE_URL`, `INTERNAL_API_KEY`) · ✅ Dockerfile · ✅ Jest + Supertest · ✅ CI workflow `.github/workflows/ci-order.yml` · ✅ example `roundMoney` util + test
⏳ All `/api/orders` routes answer **501** until you implement them.

## Run it
```bash
docker compose up -d mongo product-service    # from the repo root (product-service must be implemented for real data)
cd order-service
cp .env.example .env                          # PowerShell: copy .env.example .env
npm install
npm run dev                                   # http://localhost:3003/health
npm test
# integration tests:
# bash:       MONGO_URI_TEST=mongodb://localhost:27017/order_test npm run test:int
# PowerShell: $env:MONGO_URI_TEST="mongodb://localhost:27017/order_test"; npm run test:int
```
You don't need Por's code to be finished: unit tests use pure functions, and integration tests use a **stub product-service** (a tiny Express app started inside the test on a random port).

## Target structure
```
order-service/src/
├── index.ts  app.ts  config.ts
├── models/Order.ts
├── controllers/order.controller.ts
├── routes/order.routes.ts
├── middleware/requireAuth.ts
├── clients/productClient.ts        # all HTTP calls to product-service live here
└── utils/ pricing.ts · money.ts · validation.ts   # pure functions → unit tests
```

## Your tasks

| ID | Task | Done when |
|---|---|---|
| O1 | `Order` model (contract §5), `toJSON` → `id` | |
| O2 | `requireAuth` middleware (JWT with `JWT_SECRET`, `req.user.sub`) | 401 without token |
| O3 | `utils/pricing.ts`: `mergeItems`, `calculateSubtotal`, `applyDiscount` (WELCOME10, CAMPUS50), `calculateTotals` | UT-ORD-01..03 green |
| O4 | `clients/productClient.ts`: `getProduct(id)`, `changeStock(id, qty)` using `fetch`, header `x-internal-key`; network error → `502 Product service unavailable`, 404 → `404 Product not found: <id>` | |
| O5 | `POST /api/orders/quote` (no saving, no stock change) | Bonus's cart page shows totals |
| O6 | `POST /api/orders` — prices from product-service, stock reserved, **rollback** if one item fails, saved as `PLACED` | TC-ORD-001/003 pass |
| O7 | `GET /api/orders` (mine, newest first) and `GET /api/orders/:id` (404 if not mine) | TC-ORD-005 pass |
| O8 | `PATCH /api/orders/:id/cancel` (only PLACED, puts stock back) | TC-ORD-004 pass |
| O9 | Unit tests UT-ORD-01..03 | `npm test` green |
| O10 | Integration tests IT-ORD-01..03 with a product-service stub | `npm run test:int` green in CI |

Rules: only edit `order-service/`. Keep `/quote` registered before `/:id`. Tell Bonus when O5 is merged and Pound when O5–O8 are merged.

## How to explain it in the presentation
Service-to-service communication over HTTP (inside Docker the URL is `http://product-service:3002` — service name = hostname) · why prices come from product-service and not from the browser (security) · what happens when product-service is down (502) · rollback when stock runs out · your pricing unit tests.

---

## 🤖 AI prompt (Claude Code / Copilot Chat / ChatGPT)

Run your AI tool from the **repo root**, then paste:

```text
You are working in the CampusMart mono-repo (micro-services, university Software Deployment course).
I am Fluke and I own ONLY the folder order-service/. Do not modify files outside order-service/.

Read first:
- docs/API_CONTRACT.md sections 1, 2, 4 (only to know product-service's API) and 5 (my spec —
  follow EXACTLY: paths, JSON fields, status codes, error body { "message": ... }, JWT HS256 with
  env JWT_SECRET, discount rules, money rounded to 2 decimals)
- docs/TEST_SPEC.md (UT-ORD-01..03, IT-ORD-01..03)
- order-service/README.md (tasks O1–O10, target structure)
- order-service/src/* (keep createApp() in app.ts, /health, config.ts, index.ts, utils/money.ts)

Implement tasks O1–O10:
1. src/models/Order.ts — userId, items[{ productId, name, price, quantity, lineTotal }], subtotal,
   discountCode (string | null), discount, total, status ('PLACED' | 'CANCELLED'), timestamps;
   toJSON: id = _id string, remove _id/__v.
2. src/utils/pricing.ts (pure): mergeItems(items), calculateSubtotal(lines), applyDiscount(subtotal,
   code) (WELCOME10 = 10%, CAMPUS50 = 50 THB only if subtotal >= 300, case-insensitive, unknown
   code → error, never more than subtotal), calculateTotals(lines, code). Use roundMoney. Throw a
   small typed error class (e.g. HttpError(status, message)) that controllers turn into JSON.
   src/utils/validation.ts — validateOrderInput(body) (items non-empty, max 20, valid ObjectId,
   integer quantity 1–99, optional string discountCode).
3. src/middleware/requireAuth.ts — Bearer JWT → req.user { sub, email, name, role }, else 401.
4. src/clients/productClient.ts — getProduct(id) via fetch(`${config.productServiceUrl}/api/products/${id}`),
   changeStock(id, quantity) via PATCH .../stock with header x-internal-key = config.internalApiKey.
   Map: network error/5xx → HttpError(502, "Product service unavailable"); 404 → HttpError(404,
   "Product not found: <id>"); 409 → HttpError(409, "Insufficient stock for <name>").
5. Controller + routes replacing the 501 stubs (all routes use requireAuth):
   POST /quote, POST / (reserve stock for each item; if any fails, put back the ones already
   reserved; then save PLACED order, 201), GET / (current user's orders, newest first),
   GET /:id (400 invalid id, 404 if not found or not owner), PATCH /:id/cancel (only PLACED, else
   409 "Only PLACED orders can be cancelled"; restore stock; status CANCELLED).
6. Tests (Jest + Supertest, TypeScript):
   - tests/unit/pricing.test.ts (UT-ORD-01..03, include CAMPUS50 at 299 and 300, lower-case code,
     floating point, merged duplicates)
   - tests/integration/order.int.test.ts (IT-ORD-01..03): start a stub product-service with
     express on port 0 inside the test (GET /api/products/:id and PATCH /api/products/:id/stock,
     recording calls), set process.env.PRODUCT_SERVICE_URL / JWT_SECRET / INTERNAL_API_KEY BEFORE
     importing the app, sign tokens with jsonwebtoken, use process.env.MONGO_URI_TEST with the
     describe.skip pattern from tests/integration/db.int.test.ts. Cover: create order → 201 and
     stock PATCH called; stub closed → 502; other user's order → 404.
   Keep the existing tests passing.

Constraints: TypeScript strict, Express 5, mongoose 9, CommonJS, Node 24 global fetch (no axios),
no `any`, simple readable code with short comments (I must explain it in a presentation).

Finish by running in order-service/: npm run build, npm test, and (with
`docker run -d -p 27017:27017 mongo:7`) MONGO_URI_TEST=mongodb://localhost:27017/order_test
npm run test:int. Fix until green. Then summarize each file and give curl examples
(login via http://localhost:8080/api/auth/login to get a token first).
```
