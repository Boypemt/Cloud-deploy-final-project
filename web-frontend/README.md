# web-frontend — owner: **Bonus** (Developer)

The **web app users see** (React + Vite + TypeScript), including the **Login page required by the assignment**.
In Docker it is served by **nginx**, which is also the **API gateway**: it forwards `/api/auth`, `/api/products`, `/api/orders` to the right service.
Contract: [`docs/API_CONTRACT.md` §3–6](../docs/API_CONTRACT.md#6-frontend-fluke--routes-and-element-ids) — the **element ids in §6 are used by Pound's Robot tests; do not rename them.**

## Current state (skeleton)
✅ Vite + React + TS + React Router · ✅ routes `/login /register /products /cart /orders` (placeholder pages) · ✅ `src/api/client.ts` (fetch wrapper with Bearer token & error handling) · ✅ nginx gateway config `nginx/default.conf.template` · ✅ multi-stage Dockerfile · ✅ Vitest · ✅ CI workflow `.github/workflows/ci-frontend.yml`

## Run it
```bash
# backend for real data (from repo root):
docker compose up -d mongo auth-service product-service order-service
cd web-frontend
npm install
npm run dev            # http://localhost:5173  (Vite proxies /api/* to ports 3001-3003)
npm test               # Vitest unit tests
npm run build          # type-check + production build
# full Docker version (gateway on :8080):  docker compose up -d --build web-frontend
```
Log in with `demo@campusmart.local / Demo@1234` (admin: `admin@campusmart.local / Admin@1234`) once Bio's auth-service is merged.

## Target structure
```
web-frontend/src/
├── main.tsx  App.tsx  styles.css
├── api/ client.ts · auth.ts · products.ts · orders.ts     # one file per backend service
├── context/ AuthContext.tsx · CartContext.tsx
├── components/ Navbar.tsx · ProtectedRoute.tsx · ProductCard.tsx
├── pages/ LoginPage · RegisterPage · ProductsPage · CartPage · OrdersPage
└── utils/ format.ts · validation.ts · cart.ts              # pure functions → Vitest
```

## Your tasks

| ID | Task | Done when |
|---|---|---|
| F1 | **Login page** + `AuthContext` (token in `localStorage` `campusmart_token`, user from `/api/auth/me`), redirect to `/products`, `#login-error` on failure | TC-UI-LOGIN-001/002 pass |
| F2 | Register page (`#register-*` ids), success message then link to login | |
| F3 | `ProtectedRoute`: `/products`, `/cart`, `/orders` → `/login` without token; any API 401 → logout | TC-UI-LOGOUT-001 pass |
| F4 | Navbar: `#nav-user`, `#nav-cart-count`, `#nav-logout` | |
| F5 | Products page: list + `#product-search`, `.product-card[data-product-id]`, `.add-to-cart` | |
| F6 | `utils/cart.ts` + `CartContext` (localStorage `campusmart_cart`); Cart page with quantities, `#discount-code`, totals from `POST /api/orders/quote` | |
| F7 | Checkout → `POST /api/orders`, show `#order-success`, clear cart, show `#cart-error` on 409/400 | TC-UI-CART-001 pass |
| F8 | Orders page: `#order-list`, `.order-row`, `.order-status`, `.cancel-order` | |
| F9 | Unit tests UT-WEB-01..03 (Vitest) | `npm test` green |
| F10 | *(stretch)* admin "Add product" form when `user.role === 'admin'` | |

Rules: only edit `web-frontend/`. If you change `nginx/default.conf.template`, tell Bio (it is the gateway for everyone). Keep the UI simple and clean — function over fancy.

## How to explain it in the presentation
Login flow (form → `/api/auth/login` → token saved → protected routes) · nginx as reverse proxy / API gateway with path-based routing (same idea as K8s Ingress) · multi-stage Dockerfile (Node builds, nginx serves — small image) · env-based upstream URLs so the same image runs on compose, K8s and Azure.

---

## 🤖 AI prompt (Claude Code / Copilot Chat / ChatGPT)

Run your AI tool from the **repo root**, then paste:

```text
You are working in the CampusMart mono-repo (micro-services, university Software Deployment course).
I am Bonus and I own ONLY the folder web-frontend/ (React 19 + Vite + TypeScript + React Router 7,
served by nginx in Docker). Do not modify files outside web-frontend/.

Read first:
- docs/API_CONTRACT.md — sections 3, 4 and 5 (the backend APIs I call) and section 6 (my spec:
  routes, REQUIRED element ids/classes used by Robot Framework E2E tests, localStorage keys,
  behaviour). Use the ids EXACTLY as written.
- docs/TEST_SPEC.md (UT-WEB-01..03 and the TC-UI-* cases my pages must pass)
- web-frontend/README.md (tasks F1–F10, target structure)
- web-frontend/src/* (keep src/api/client.ts apiFetch + TOKEN_KEY, keep vite.config.ts proxy,
  keep nginx/ and Dockerfile unchanged)

Implement tasks F1–F9 (F10 if time allows):
1. src/api/auth.ts, products.ts, orders.ts — typed functions on top of apiFetch (types for User,
   Product, Order, Quote matching the contract). Always relative URLs (/api/...).
2. src/context/AuthContext.tsx — login(email, password), register(...), logout(), user, token;
   loads the user with GET /api/auth/me on start if a token exists; any ApiError with status 401
   logs out.
3. src/context/CartContext.tsx + src/utils/cart.ts (pure functions addToCart, removeFromCart,
   updateQuantity, cartCount, toOrderItems) persisted in localStorage "campusmart_cart".
4. src/utils/validation.ts — validateLoginForm({ email, password }) → errors object.
5. Components: Navbar (#nav-user, #nav-cart-count, #nav-logout), ProtectedRoute, ProductCard.
6. Pages:
   - LoginPage (#login-email, #login-password, #login-submit, #login-error, link to /register;
     on success navigate to /products)
   - RegisterPage (#register-name, #register-email, #register-password, #register-submit,
     #register-error, #register-success)
   - ProductsPage (#product-search with debounce, #product-list, .product-card[data-product-id]
     containing .product-name, .product-price (use formatPrice), .add-to-cart)
   - CartPage (#cart-items, .cart-item, quantity +/-, #discount-code, #apply-discount,
     #cart-subtotal, #cart-discount, #cart-total from POST /api/orders/quote, #checkout-button →
     POST /api/orders → #order-success and clear cart; errors in #cart-error)
   - OrdersPage (#order-list, .order-row[data-order-id], .order-status, .cancel-order for PLACED)
   Protect /products, /cart, /orders with ProtectedRoute.
7. Vitest tests in tests/: validation.test.ts (UT-WEB-01), cart.test.ts (UT-WEB-02, UT-WEB-03).
   Keep tests/format.test.ts passing.
8. Simple, clean responsive CSS in src/styles.css (no UI library needed). Show loading and error
   states. Escape nothing manually — React already escapes text (never use dangerouslySetInnerHTML).

Constraints: TypeScript strict, no `any`, function components + hooks, readable code with short
comments (I must explain it in a presentation). No new dependencies unless really needed.

Finish by running in web-frontend/: npm run build and npm test, fix until green. Then explain the
login flow and list which file implements each task.
```
