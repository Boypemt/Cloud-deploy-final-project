/**
 * All configuration comes from environment variables (12-factor style),
 * so the same Docker image runs locally, in CI, on Azure and on Kubernetes.
 */
export const config = {
  serviceName: 'auth-service',
  port: Number(process.env.PORT) || 3001,
  mongoUri: process.env.MONGO_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@campusmart.local',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'Admin@1234',
  demoEmail: process.env.DEMO_EMAIL ?? 'demo@campusmart.local',
  demoPassword: process.env.DEMO_PASSWORD ?? 'Demo@1234',
  version: process.env.APP_VERSION ?? 'dev',
};
