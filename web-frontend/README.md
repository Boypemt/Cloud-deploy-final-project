# web-frontend — owner: **Bonus** (Developer)

The **web app users see** (React + Vite + TypeScript), including the **Login page required by the assignment**.
In Docker it is served by **nginx**, which is also the **API gateway**: it forwards `/api/auth`, `/api/products`, `/api/orders` to the right service.
Contract: [`docs/API_CONTRACT.md` §3–6](../docs/API_CONTRACT.md#6-frontend-fluke--routes-and-element-ids) — the **element ids in §6 are used by Pound's Robot tests; do not rename them.**

## Implemented (Bonus delivery)
F1–F9 completed, plus F10 admin Add product. Typed service API clients, authenticated route guard,
persistent cart, server quotes, checkout and order cancellation are implemented.
Required Robot Framework selectors and existing Docker/nginx/Vite proxy configuration are retained.

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

## Implementation map

- F1–F3: `src/context/AuthContext.tsx`, `src/components/ProtectedRoute.tsx`, `src/api/client.ts`, login/register pages.
- F4: `src/components/Navbar.tsx`.
- F5/F10: `src/pages/ProductsPage.tsx`, `src/components/ProductCard.tsx`, `src/api/products.ts`.
- F6/F7: `src/utils/cart.ts`, `src/context/CartContext.tsx`, `src/pages/CartPage.tsx`, `src/api/orders.ts`.
- F8: `src/pages/OrdersPage.tsx`.
- F9: `tests/validation.test.ts`, `tests/cart.test.ts`; additional API session tests in `tests/client.test.ts`.

Cart supports at most 20 distinct products and 99 units per product, matching the order contract.
Checkout waits for a quote matching current cart and applied code. An edited discount code must
be applied before checkout. Prices and discounts are always calculated by order-service.
All API 401 responses notify AuthContext, clearing token/cart and causing the protected route to redirect.

Login flow: validate form → POST `/api/auth/login` → save token in `campusmart_token` →
load `/api/auth/me` → redirect to `/products`; future API calls attach the Bearer token.

Backend endpoints are still skeletons in the source revision used for this delivery. Full end-to-end
flows require Bio, Por and Fluke to implement their services; frontend unit/build checks can run independently.


## UI refresh
CampusMart purple/cream storefront, responsive product grid, original SVG product illustrations, category API filters and consistent shared page styling. Google Fonts fall back to system fonts offline. The isolated preview server is not included in this production source package.
