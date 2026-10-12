# ---------- Stage 1: build TypeScript -> JavaScript ----------
FROM node:24-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Stage 2: small runtime image ----------
FROM node:24-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /usr/src/app/dist ./dist

# Release version is injected by the release pipeline (shown on GET /health)
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION \
    PORT=3003
EXPOSE 3003
USER node
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
