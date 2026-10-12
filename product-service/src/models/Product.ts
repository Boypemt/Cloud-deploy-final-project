import { Schema, model, InferSchemaType } from 'mongoose';
import { CATEGORIES } from '../utils/validation';

/**
 * Product document (API_CONTRACT §4). The API layer validates first (utils/validation.ts);
 * these schema rules are a second safety net inside the database layer.
 */
const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'stock must be an integer' },
    },
    category: { type: String, required: true, enum: CATEGORIES },
    imageUrl: { type: String, default: '' },
  },
  {
    timestamps: true, // createdAt + updatedAt
    toJSON: {
      // Contract rule: return `id` (string) — never `_id` or `__v`.
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export type ProductDoc = InferSchemaType<typeof productSchema>;
export const Product = model('Product', productSchema);
