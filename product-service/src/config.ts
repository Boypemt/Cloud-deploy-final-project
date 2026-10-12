/**
 * All configuration comes from environment variables (12-factor style),
 * so the same Docker image runs locally, in CI, on Azure and on Kubernetes.
 */
export const config = {
  serviceName: 'product-service',
  port: Number(process.env.PORT) || 3002,
  mongoUri: process.env.MONGO_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
  internalApiKey: process.env.INTERNAL_API_KEY ?? 'dev-internal-key',
  seedProducts: (process.env.SEED_PRODUCTS ?? 'true') === 'true',
  version: process.env.APP_VERSION ?? 'dev',
};
