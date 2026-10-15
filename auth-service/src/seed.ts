import { config } from './config';
import { Role, User } from './models/User';
import { hashPassword } from './utils/password';

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: Role;
}

/**
 * The two accounts from API_CONTRACT §3. The QA tests log in as the demo user and the admin
 * product tests need the admin, so both must exist right after `docker compose up`.
 * Passwords come from env vars (config.ts) — no credentials in the code.
 */
export const SEED_USERS: SeedUser[] = [
  { name: 'Admin', email: config.adminEmail, password: config.adminPassword, role: 'admin' },
  { name: 'Demo User', email: config.demoEmail, password: config.demoPassword, role: 'user' },
];

/**
 * Creates the seed users only when they are missing, so this is safe to run on EVERY start-up
 * (idempotent): a restart or a second replica must not duplicate them or reset their passwords.
 * Returns how many users were created.
 */
export async function seedUsers(): Promise<number> {
  let created = 0;

  for (const seed of SEED_USERS) {
    // Same normalisation as register, so a differently-cased env value still matches the index.
    const email = seed.email.trim().toLowerCase();
    if (await User.exists({ email })) continue;

    try {
      await User.create({
        name: seed.name,
        email,
        passwordHash: await hashPassword(seed.password),
        role: seed.role,
      });
      created += 1;
    } catch (err) {
      // Two replicas starting at the same moment: the unique index lets only one of them win.
      // The loser can ignore its duplicate-key error — the user it wanted now exists.
      if (typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000) continue;
      throw err;
    }
  }

  return created;
}
