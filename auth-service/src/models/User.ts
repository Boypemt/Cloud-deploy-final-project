import { Schema, model, InferSchemaType } from 'mongoose';

/** The two roles in the system (API_CONTRACT §2) — product-service checks for 'admin'. */
export const ROLES = ['user', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/**
 * User document (API_CONTRACT §3). The API layer validates first (utils/validation.ts);
 * these schema rules are a second safety net inside the database layer.
 */
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 50 },
    // unique + lowercase + trim: the index is the real guard against two accounts with the same
    // email, and normalising here means "Demo@..." and "demo@..." can never both exist.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Only the bcrypt hash is stored — never the password itself.
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ROLES, default: 'user' },
  },
  {
    timestamps: true, // createdAt + updatedAt
    toJSON: {
      // Contract rules: return `id` (string), never `_id`/`__v`, and NEVER the password hash —
      // this transform is why res.json({ user }) is safe to send straight to the browser.
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
export type UserDocument = InstanceType<typeof User>;
