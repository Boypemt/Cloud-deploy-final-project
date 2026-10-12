# ---------- Stage 1: build the React app ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Stage 2: nginx serves the build and proxies /api/* ----------
FROM nginx:1.27-alpine
# Default upstreams = docker-compose / Kubernetes service names. Override with -e on other platforms.
ENV AUTH_SERVICE_URL=http://auth-service:3001 \
    PRODUCT_SERVICE_URL=http://product-service:3002 \
    ORDER_SERVICE_URL=http://order-service:3003
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1/health || exit 1
