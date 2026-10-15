import { useEffect, useState, type FormEvent } from "react";
import {
  listProducts,
  createProduct,
  type Product,
  type Category,
} from "../api/products";
import { useAuth } from "../context/AuthContext";
import ProductArt from "../components/ProductArt";
import ProductCard from "../components/ProductCard";
import { errorMessage } from "../utils/validation";
export default function ProductsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      listProducts(search, page, controller.signal, category)
        .then((result) => {
          if (!controller.signal.aborted) {
            setItems(result.items);
            setTotal(result.total);
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setError(errorMessage(err));
            setItems([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, page, revision, category]);
  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    setAdminMessage("");
    try {
      await createProduct({
        name: String(data.get("name")).trim(),
        description: String(data.get("description")).trim(),
        price: Number(data.get("price")),
        stock: Number(data.get("stock")),
        category: String(data.get("category")) as Category,
        imageUrl: "",
      });
      form.reset();
      setAdminMessage("Product added.");
      setRevision((v) => v + 1);
    } catch (err) {
      setAdminMessage(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section id="products-page">
      <div className="shop-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span /> YOUR EVERYDAY CAMPUS STORE
          </span>
          <h1>
            Big campus energy.
            <br />
            Little everyday <em>essentials.</em>
          </h1>
          <p>
            From the first lecture to the last study session.
            <br className="desktop-break" /> Find your favourites for life on
            campus.
          </p>
          <a className="hero-cta" href="#shop-catalog">
            Explore the shop <span>↗</span>
          </a>
          <div className="hero-footnote">
            <span>✦</span> Study. Snack. Repeat.
          </div>
        </div>
        <div className="hero-art" aria-label="Illustrated campus essentials">
          <span className="hero-orbit" />
          <span className="hero-spark spark-one">✳</span>
          <span className="hero-spark spark-two">✦</span>
          <div className="hero-notebook">
            <ProductArt name="CMU Notebook A5" category="stationery" />
          </div>
          <div className="hero-tea">
            <ProductArt name="Thai Milk Tea" category="food" />
          </div>
          <div className="hero-hoodie">
            <ProductArt name="CAMT Hoodie" category="clothing" />
          </div>
          <span className="hero-sticker">
            a little more
            <br />
            <b>campus.</b>
            <span>☺</span>
          </span>
          <span className="hero-caption">
            GOOD DAYS START WITH THE LITTLE THINGS
          </span>
        </div>
      </div>
      <div className="store-notes">
        <span>
          <b>✧</b> Picked for student life
        </span>
        <span>
          <b>↗</b> Everyday essentials, easy prices
        </span>
        <span>
          <b>♡</b> A little something for everyone
        </span>
      </div>
      <div id="shop-catalog" className="catalog-heading">
        <div>
          <span className="eyebrow">THE CAMPUS EDIT</span>
          <h2>
            Find your everyday favourites<span>.</span>
          </h2>
        </div>
        <div className="search-field">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <label className="sr-only" htmlFor="product-search">
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Find something good…"
          />
        </div>
      </div>
      <div className="catalog-toolbar">
        <div
          className="category-tabs"
          role="group"
          aria-label="Product categories"
        >
          {[
            ["", "All essentials", "✦"],
            ["stationery", "Stationery", "✎"],
            ["electronics", "Tech & gadgets", "⌁"],
            ["food", "Snacks & sips", "☕"],
            ["clothing", "Campus wear", "♧"],
            ["other", "Lifestyle", "☼"],
          ].map(([value, label, icon]) => (
            <button
              key={value}
              className={category === value ? "selected" : ""}
              aria-pressed={category === value}
              onClick={() => {
                setCategory(value);
                setPage(1);
              }}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </div>
        <span className="result-count">
          {loading ? "Finding your favourites…" : `${total} finds for you`}
        </span>
      </div>
      {loading && <p role="status">Loading products…</p>}
      {error && (
        <p className="error" role="alert">
          {error}{" "}
          <button onClick={() => setRevision((v) => v + 1)}>Retry</button>
        </p>
      )}
      <div id="product-list" className="product-grid" aria-busy={loading}>
        {!loading &&
          items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
      </div>
      {!loading && !error && !items.length && <p>No products found.</p>}
      <div className="actions pagination">
        <button
          disabled={loading || page === 1}
          onClick={() => setPage((v) => v - 1)}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={loading || page * 20 >= total}
          onClick={() => setPage((v) => v + 1)}
        >
          Next
        </button>
      </div>
      {user?.role === "admin" && (
        <details className="panel">
          <summary>Add product (admin)</summary>
          <form onSubmit={addProduct}>
            <label htmlFor="admin-name">Name</label>
            <input id="admin-name" name="name" required maxLength={100} />
            <label htmlFor="admin-description">Description</label>
            <input id="admin-description" name="description" maxLength={500} />
            <label htmlFor="admin-price">Price (THB)</label>
            <input
              id="admin-price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
            />
            <label htmlFor="admin-stock">Stock</label>
            <input
              id="admin-stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              required
            />
            <label htmlFor="admin-category">Category</label>
            <select id="admin-category" name="category">
              {["stationery", "electronics", "food", "clothing", "other"].map(
                (category) => (
                  <option key={category}>{category}</option>
                ),
              )}
            </select>
            <button disabled={saving}>
              {saving ? "Saving…" : "Add product"}
            </button>
            {adminMessage && <p role="status">{adminMessage}</p>}
          </form>
        </details>
      )}
    </section>
  );
}
