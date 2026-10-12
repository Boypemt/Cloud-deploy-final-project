/**
 * All configuration comes from environment variables (12-factor style),
 * so the same Docker image runs locally, in CI, on Azure and on Kubernetes.
 */
export const config = {
  serviceName: 'order-service',
  port: Number(process.env.PORT) || 3003,
  mongoUri: process.env.MONGO_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL ?? 'http://localhost:3002',
  internalApiKey: process.env.INTERNAL_API_KEY ?? 'dev-internal-key',
  version: process.env.APP_VERSION ?? 'dev',
};
