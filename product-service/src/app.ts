import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config';
import productRoutes from './routes/product.routes';

/**
 * Builds the Express app WITHOUT starting it, so tests can use supertest
 * against it without opening a port or connecting to MongoDB.
 */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check — used by Docker, docker-compose, Kubernetes probes and the QA smoke tests.
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: config.serviceName,
      version: config.version,
      db: mongoose.connection.readyState === 1 ? 'up' : 'down',
    });
  });

  app.use('/api/products', productRoutes);

  // Unknown route -> 404 in the shared error format { message }
  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  // Last-resort error handler (Express 5 forwards async errors here automatically)
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  };
  app.use(errorHandler);

  return app;
}
