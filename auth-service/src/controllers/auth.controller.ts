import { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { User, UserDocument } from '../models/User';
import { hashPassword, verifyPassword } from '../utils/password';
import { AuthUser, signToken } from '../utils/token';
import { validateLoginInput, validateRegisterInput } from '../utils/validation';

const EMAIL_TAKEN = { message: 'Email already registered' };
const INVALID_CREDENTIALS = { message: 'Invalid email or password' };
const USER_NOT_FOUND = { message: 'User not found' };

/** The claims we put in the token — sub is the Mongo _id as a string (API_CONTRACT §2). */
const toAuthUser = (user: UserDocument): AuthUser => ({
  sub: String(user._id),
  email: user.email,
  name: user.name,
  role: user.role,
});

/** MongoDB's "duplicate key" error, raised by the unique index on email. */
function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;
}

/** POST /api/auth/register → 201 { user } */
export const register: RequestHandler = async (req, res) => {
  const result = validateRegisterInput(req.body);
  if (!result.ok) return void res.status(400).json({ message: result.message });
  const { name, email, password } = result.value;

  // Checked up front so the normal "email taken" case gets a clean 409 without hitting the index.
  if (await User.exists({ email })) return void res.status(409).json(EMAIL_TAKEN);

  try {
    // role is hard-coded: a client sending { role: "admin" } must not be able to promote itself.
    const user = await User.create({ name, email, passwordHash: await hashPassword(password), role: 'user' });
    res.status(201).json({ user });
  } catch (err) {
    // Two requests with the same email can both pass the exists() check at the same time; the
    // unique index is the real guard, so translate its error into the same 409 instead of a 500.
    if (isDuplicateKeyError(err)) return void res.status(409).json(EMAIL_TAKEN);
    throw err;
  }
};

/** POST /api/auth/login → 200 { token, user } */
export const login: RequestHandler = async (req, res) => {
  const result = validateLoginInput(req.body);
  if (!result.ok) return void res.status(400).json({ message: result.message });
  const { email, password } = result.value;

  const user = await User.findOne({ email });
  // ONE message for "no such email" and for "wrong password": a different answer would let an
  // attacker find out which emails have an account (user enumeration).
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return void res.status(401).json(INVALID_CREDENTIALS);
  }

  res.json({ token: signToken(toAuthUser(user)), user });
};

/** GET /api/auth/me (requireAuth) → 200 { user } */
export const me: RequestHandler = async (req, res) => {
  // requireAuth already verified the token and put the claims on req.user.
  const sub = req.user?.sub;
  if (!sub) return void res.status(401).json({ message: 'Unauthorized' });

  // The token only proves WHO the user was when it was signed, so the profile is re-read from the
  // database: name/role changes show up, and a deleted account gets 404 instead of stale data.
  // A hand-signed token can carry any sub, so check the id shape before asking Mongo (a bad id
  // would otherwise throw a CastError → 500).
  if (!mongoose.isValidObjectId(sub)) return void res.status(404).json(USER_NOT_FOUND);
  const user = await User.findById(sub);
  if (!user) return void res.status(404).json(USER_NOT_FOUND);

  res.json({ user });
};
