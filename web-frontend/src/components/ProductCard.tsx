import type { Product } from "../api/products";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import ProductArt from "./ProductArt";
export default function ProductCard({ product }: { product: Product }) {
  const { cart, add } = useCart();
  const quantity =
    cart.find((item) => item.productId === product.id)?.quantity ?? 0;
  const disabled =
    quantity >= Math.min(product.stock, 99) ||
    (cart.length >= 20 && quantity === 0);
  return (
    <article className="product-card" data-product-id={product.id}>
      <div className={`product-visual visual-${product.category}`}>
        <ProductArt
          name={product.name}
          category={product.category}
          imageUrl={product.imageUrl}
        />
        {product.stock > 0 && product.stock <= 5 && (
          <span className="stock-badge">Only {product.stock} left</span>
        )}
        {quantity > 0 && (
          <span className="in-cart-badge">{quantity} in your bag</span>
        )}
      </div>
      <div className="product-info">
        <span className="product-category">
          {product.category === "other" ? "Lifestyle" : product.category}
        </span>
        <h2 className="product-name">{product.name}</h2>
        <p className="product-description">{product.description}</p>
        <div className="product-bottom">
          <div>
            <p className="product-price">{formatPrice(product.price)}</p>
            <span className="stock-note">
              {product.stock ? "● In stock" : "Out of stock"}
            </span>
          </div>
          <button
            className="add-to-cart"
            disabled={disabled}
            aria-label={`Add ${product.name} to cart`}
            onClick={() =>
              add({
                productId: product.id,
                name: product.name,
                price: product.price,
              })
            }
          >
            {product.stock === 0 ? (
              "Sold out"
            ) : (
              <>
                <span aria-hidden="true">＋</span> Add
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
