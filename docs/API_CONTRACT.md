# CampusMart — API Contract (v1)

> **This file is the law.** Every service, the frontend and the Robot tests are written against it.
> If you need to change anything here, ask Bio (PM) first and update this file **in the same PR**.
> When you use AI to write code, paste the section for your service into the prompt.

## 0. Overview

| Service | Owner | Port (local) | Base path | Database (Mongo db name) |
|---|---|---|---|---|
| auth-service | Bio | 3001 | `/api/auth` | `campusmart_auth` |
| product-service | Por | 3002 | `/api/products` | `campusmart_products` |
| order-service | Fluke | 3003 | `/api/orders` | `campusmart_orders` |
| web-frontend (React + nginx gateway) | Bonus | 8080 → 80 | `/` | — |
| qa-automation (Robot Framework) | Pound | — | — | — |

Users only ever talk to the **gateway** (`http://localhost:8080`). nginx forwards:

| Path from the browser | Goes to |
|---|---|
| `/api/auth/*` | `auth-service:3001` (same path) |
| `/api/products*` | `product-service:3002` (same path) |
| `/api/orders*` | `order-service:3003` (same path) |
| `/health` | nginx itself |
| `/health/auth`, `/health/product`, `/health/order` | `GET /health` of that service |
| anything else | React app (`index.html`) |

## 1. Rules for ALL backend services

1. **JSON only.** Request and response bodies are JSON (`Content-Type: application/json`).
2. **Error format** — every non-2xx response has this body:
   ```json
   { "message": "Human readable explanation" }
   ```
3. **Status codes** — use exactly these:

   | Code | When |
   |---|---|
   | 200 | OK (read / update / delete / login) |
   | 201 | Created (register, create product, create order) |
   | 400 | Validation error (missing field, wrong type, invalid ObjectId, unknown discount code) |
   | 401 | No token / invalid token / expired token / wrong email or password |
   | 403 | Valid token but not allowed (e.g. user is not admin, wrong internal key) |
   | 404 | Resource not found (or belongs to another user) |
   | 409 | Conflict (email already registered, insufficient stock, order cannot be cancelled) |
   | 501 | Not implemented yet (skeleton stubs only) |
   | 502 | A service this service depends on is down (order → product) |
   | 500 | Unexpected server error |

4. **IDs** — return MongoDB `_id` as a string field named **`id`** (use a `toJSON` transform). Never return `_id` or `__v`.
5. **Health** — `GET /health` → `200 { "status": "ok", "service": "<name>", "version": "<APP_VERSION>", "db": "up" | "down" }` (already in the skeleton — do not remove).
6. **Security** — never return password hashes; never log tokens or passwords; validate types so `{"email": {"$ne": null}}` (NoSQL injection) is rejected with 400.
7. **Config** — read everything from environment variables (see each `.env.example`). No secrets in code.

## 2. Authentication (JWT) — shared by all services

- Header: `Authorization: Bearer <token>`
- Algorithm **HS256**, secret = env **`JWT_SECRET`** (same value in auth, product and order).
- Expiry = env `JWT_EXPIRES_IN` (default `1h`).
- **Payload (exactly these claims):**
  ```json
  { "sub": "<userId>", "email": "demo@campusmart.local", "name": "Demo User", "role": "user" }
  ```
  `role` is `"user"` or `"admin"`.
- product-service and order-service **verify the token themselves** with `jsonwebtoken.verify(token, JWT_SECRET)` — they do not call auth-service.
- Missing/invalid/expired token → `401 { "message": "Unauthorized" }`.

## 3. auth-service (Bio) — `http://localhost:3001`

### User object (as returned by the API)
```json
{ "id": "66f1...", "name": "Demo User", "email": "demo@campusmart.local", "role": "user", "createdAt": "2026-10-12T05:00:00.000Z" }
```

### `POST /api/auth/register`
Request:
```json
{ "name": "Bio", "email": "bio@campusmart.local", "password": "secret123" }
```
Rules: `name` non-empty string (trim) ≤ 50 chars; `email` valid format, stored lower-case; `password` string ≥ 6 chars. New users always get `role: "user"`.

| Result | Status | Body |
|---|---|---|
| Success | 201 | `{ "user": User }` |
| Invalid input | 400 | `{ "message": "..." }` |
| Email already exists | 409 | `{ "message": "Email already registered" }` |

### `POST /api/auth/login`
Request: `{ "email": "demo@campusmart.local", "password": "Demo@1234" }`

| Result | Status | Body |
|---|---|---|
| Success | 200 | `{ "token": "<jwt>", "user": User }` |
| Missing email/password or not strings | 400 | `{ "message": "..." }` |
| Wrong email or password | 401 | `{ "message": "Invalid email or password" }` (same message for both — don't reveal which) |

### `GET /api/auth/me` (Bearer token)
| Result | Status | Body |
|---|---|---|
| Success | 200 | `{ "user": User }` |
| No/invalid token | 401 | `{ "message": "Unauthorized" }` |
| User deleted | 404 | `{ "message": "User not found" }` |

### Seed data (created on start-up if missing — tests depend on it)
| Email | Password | Name | Role |
|---|---|---|---|
| env `ADMIN_EMAIL` (default `admin@campusmart.local`) | env `ADMIN_PASSWORD` (default `Admin@1234`) | Admin | admin |
| env `DEMO_EMAIL` (default `demo@campusmart.local`) | env `DEMO_PASSWORD` (default `Demo@1234`) | Demo User | user |

Passwords are hashed with **bcryptjs** (10 salt rounds).

## 4. product-service (Por) — `http://localhost:3002`

### Product object
```json
{
  "id": "66f2...",
  "name": "CMU Notebook A5",
  "description": "80 pages, dotted",
  "price": 45,
  "stock": 120,
  "category": "stationery",
  "imageUrl": "",
  "createdAt": "...",
  "updatedAt": "..."
}
```
Rules: `name` 1–100 chars; `price` number ≥ 0; `stock` integer ≥ 0; `category` one of `stationery | electronics | food | clothing | other`; `description` ≤ 500 chars (optional, default `""`); `imageUrl` optional string.

### `GET /api/products` (public)
Query params (all optional): `search` (case-insensitive match on name), `category`, `page` (default 1), `limit` (default 20, max 100).
→ `200 { "items": Product[], "total": 8, "page": 1, "limit": 20 }` sorted by `name` ascending.

### `GET /api/products/:id` (public)
→ `200 Product` · `400` invalid id · `404 { "message": "Product not found" }`

### `POST /api/products` (Bearer, **admin only**)
Body: product fields (no id). → `201 Product` · `400` · `401` · `403 { "message": "Admin only" }`

### `PUT /api/products/:id` (Bearer, admin only)
Body: any subset of product fields (validated). → `200 Product` · `400` · `401` · `403` · `404`

### `DELETE /api/products/:id` (Bearer, admin only)
→ `200 { "message": "Product deleted" }` · `401` · `403` · `404`

### `PATCH /api/products/:id/stock` (internal — called by order-service only)
Header: `x-internal-key: <INTERNAL_API_KEY>`
Body: `{ "quantity": -2 }` (negative = take from stock, positive = put back)
→ `200 Product` (with new stock) · `400` (quantity not an integer) · `403` wrong/missing key · `404` · `409 { "message": "Insufficient stock" }` if stock would go below 0.
The update must be **atomic** (e.g. `findOneAndUpdate({ _id, stock: { $gte: -quantity } }, { $inc: { stock: quantity } })`).

### Seed data (when the collection is empty and `SEED_PRODUCTS=true`)
At least these 8 products (tests use the first two names):

| name | price | stock | category |
|---|---|---|---|
| CMU Notebook A5 | 45 | 120 | stationery |
| Blue Gel Pen (3-pack) | 35 | 200 | stationery |
| USB-C Cable 1m | 129 | 50 | electronics |
| Wireless Mouse | 359 | 25 | electronics |
| Thai Milk Tea | 40 | 80 | food |
| Instant Noodles Box | 99 | 60 | food |
| CAMT Hoodie | 590 | 15 | clothing |
| Limited Edition Mug | 250 | 2 | other |

## 5. order-service (Fluke) — `http://localhost:3003`

All routes require **Bearer token** (any role). `userId` = token `sub`.

### Order object
```json
{
  "id": "66f3...",
  "userId": "66f1...",
  "items": [
    { "productId": "66f2...", "name": "CMU Notebook A5", "price": 45, "quantity": 2, "lineTotal": 90 }
  ],
  "subtotal": 90,
  "discountCode": "WELCOME10",
  "discount": 9,
  "total": 81,
  "status": "PLACED",
  "createdAt": "..."
}
```
`status` is `PLACED` or `CANCELLED`. `discountCode` is `null` when not used.

### Pricing rules (pure functions — must be unit tested)
- `lineTotal = price × quantity`; `subtotal = Σ lineTotal`
- Discount codes (case-insensitive, stored upper-case):

  | Code | Rule |
  |---|---|
  | `WELCOME10` | 10% off subtotal |
  | `CAMPUS50` | 50 THB off, only if subtotal ≥ 300 (otherwise 400 `"Discount requires subtotal of at least 300"`) |

- Unknown code → `400 { "message": "Invalid discount code" }`
- Discount can never exceed subtotal; `total = subtotal − discount`; every money value rounded to 2 decimals.

### Request body for quote / create
```json
{ "items": [ { "productId": "66f2...", "quantity": 2 } ], "discountCode": "WELCOME10" }
```
Rules: `items` non-empty array (max 20); each `productId` valid ObjectId; `quantity` integer 1–99; duplicate productIds are merged (quantities added); `discountCode` optional string.

### `POST /api/orders/quote`
Calculates prices **without saving or touching stock** (used by the cart page).
→ `200 { "items": [...], "subtotal": 90, "discountCode": "WELCOME10", "discount": 9, "total": 81 }`
Errors: `400` · `401` · `404 { "message": "Product not found: <id>" }` · `409 "Insufficient stock for <name>"` · `502 { "message": "Product service unavailable" }`

### `POST /api/orders`
1. Validate body. 2. `GET {PRODUCT_SERVICE_URL}/api/products/:id` for each item (take **name and price from product-service**, never from the client). 3. Check stock. 4. Compute pricing. 5. `PATCH .../stock` with `-quantity` for each item (header `x-internal-key`); if one fails, put back the ones already taken. 6. Save order with status `PLACED`.
→ `201 Order` · same errors as quote.

### `GET /api/orders`
→ `200 Order[]` of the current user only, newest first.

### `GET /api/orders/:id`
→ `200 Order` · `400` invalid id · `404 { "message": "Order not found" }` if missing **or owned by someone else**.

### `PATCH /api/orders/:id/cancel`
Only the owner, only when status is `PLACED`. Puts the stock back (`PATCH .../stock` with `+quantity`).
→ `200 Order` (status `CANCELLED`) · `404` · `409 { "message": "Only PLACED orders can be cancelled" }`

## 6. Frontend (Bonus) — routes and element ids

The Robot E2E tests find elements by these **ids/classes — do not rename them.**

| Route | Purpose | Required elements |
|---|---|---|
| `/login` | Login page (**required by the assignment**) | `#login-email`, `#login-password`, `#login-submit`, `#login-error` (shown on failure), link to `/register` |
| `/register` | Sign-up | `#register-name`, `#register-email`, `#register-password`, `#register-submit`, `#register-error`, `#register-success` |
| `/products` | Product list + search | `#product-search`, `#product-list`, each product `.product-card` with attribute `data-product-id`, inside it `.product-name`, `.product-price`, `.add-to-cart` button |
| `/cart` | Cart + discount + checkout | `#cart-items`, each `.cart-item`, `#discount-code`, `#apply-discount`, `#cart-subtotal`, `#cart-discount`, `#cart-total`, `#checkout-button`, `#order-success` (after checkout), `#cart-error` |
| `/orders` | My orders | `#order-list`, each `.order-row` with `data-order-id`, `.order-status`, `.cancel-order` button |
| navbar (all pages) | | `#nav-user` (user name), `#nav-cart-count`, `#nav-logout` |

Behaviour:
- Token saved in `localStorage` key **`campusmart_token`** (constant `TOKEN_KEY` in `src/api/client.ts`).
- Successful login → redirect to `/products`. Logout → clear token + cart → `/login`.
- `/products`, `/cart`, `/orders` redirect to `/login` when there is no token; a `401` from any API also logs the user out.
- Cart is kept in `localStorage` key `campusmart_cart` as `[{ productId, name, price, quantity }]`.
- Totals shown on the cart page come from `POST /api/orders/quote` (do not re-implement pricing in the browser).
- Admin extra (stretch): if `role === "admin"`, show a simple "Add product" form on `/products`.
