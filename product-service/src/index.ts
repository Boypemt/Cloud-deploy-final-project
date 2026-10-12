import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from './config';
import { createApp } from './app';

// Optional workaround for networks where MongoDB Atlas SRV lookups fail.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()));
}

async function start() {
  if (!config.mongoUri) {
    console.error('Missing MONGO_URI. Put it in .env (local) or pass -e MONGO_URI=... (Docker).');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri);
  console.log(`[${config.serviceName}] connected to MongoDB`);

  // TODO (task P5 in README): seed demo products here when the collection is empty and SEED_PRODUCTS=true.

  createApp().listen(config.port, () => {
    console.log(`[${config.serviceName}] v${config.version} listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error(`[${config.serviceName}] failed to start`, err);
  process.exit(1);
});
