import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development (npm run dev) Vite forwards /api/* to the services running on your machine.
// In Docker / Kubernetes, nginx does the same job (see nginx/default.conf.template).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/auth': 'http://localhost:3001',
      '/api/products': 'http://localhost:3002',
      '/api/orders': 'http://localhost:3003',
    },
  },
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
