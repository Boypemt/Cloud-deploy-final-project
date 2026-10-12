import { config } from './config';
import { Product } from './models/Product';

/** Demo products from API_CONTRACT §4 — the QA tests use the first two names. */
export const SEED_PRODUCTS = [
  { name: 'CMU Notebook A5', description: '80 pages, dotted', price: 45, stock: 120, category: 'stationery' },
  { name: 'Blue Gel Pen (3-pack)', description: '0.5 mm, blue ink', price: 35, stock: 200, category: 'stationery' },
  { name: 'USB-C Cable 1m', description: 'Fast charging, braided', price: 129, stock: 50, category: 'electronics' },
  { name: 'Wireless Mouse', description: '2.4 GHz, silent click', price: 359, stock: 25, category: 'electronics' },
  { name: 'Thai Milk Tea', description: 'Iced, less sweet', price: 40, stock: 80, category: 'food' },
  { name: 'Instant Noodles Box', description: '10 packs, tom yum flavour', price: 99, stock: 60, category: 'food' },
  { name: 'CAMT Hoodie', description: 'Cotton, size M-XL', price: 590, stock: 15, category: 'clothing' },
  { name: 'Limited Edition Mug', description: 'Only a few left', price: 250, stock: 2, category: 'other' },
];

/** Insert the demo products only when the collection is empty (safe to call on every start). */
export async function seedProducts(): Promise<number> {
  if ((await Product.estimatedDocumentCount()) > 0) return 0;
  await Product.insertMany(SEED_PRODUCTS);
  return SEED_PRODUCTS.length;
}

/** Called from index.ts on start-up when SEED_PRODUCTS=true. */
export async function seedIfEnabled(): Promise<void> {
  if (!config.seedProducts) return;
  const inserted = await seedProducts();
  if (inserted > 0) console.log(`[${config.serviceName}] seeded ${inserted} demo products`);
}
