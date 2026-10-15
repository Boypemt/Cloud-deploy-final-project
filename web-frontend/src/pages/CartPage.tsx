import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { quoteOrder, createOrder, type Quote } from "../api/orders";
import { toOrderItems } from "../utils/cart";
import { formatPrice } from "../utils/format";
import { errorMessage } from "../utils/validation";
export default function CartPage() {
  const { cart, update, remove, clear } = useCart();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quotedKey, setQuotedKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [revision, setRevision] = useState(0);
  const requestKey = JSON.stringify({
    items: toOrderItems(cart),
    discountCode: applied,
  });
  const ready = Boolean(quote && quotedKey === requestKey);
  useEffect(() => {
    const controller = new AbortController();
    setQuote(null);
    setError("");
    if (cart.length)
      quoteOrder(toOrderItems(cart), applied, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setQuote(result);
            setQuotedKey(requestKey);
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) setError(errorMessage(err));
        });
    return () => controller.abort();
  }, [cart, applied, requestKey, revision]);
  async function checkout() {
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const order = await createOrder(toOrderItems(cart), applied);
      clear();
      setCode("");
      setApplied("");
      setSuccess(`Order ${order.id} placed successfully.`);
    } catch (err) {
      setError(errorMessage(err));
      setQuote(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="cart-page">
      <h1>Your cart</h1>
      {success && (
        <p id="order-success" className="success" role="status">
          {success} <Link to="/orders">View orders</Link>
        </p>
      )}
      <div id="cart-items">
        {cart.map((item) => (
          <article className="cart-item panel" key={item.productId}>
            <h2>{item.name}</h2>
            <p>{formatPrice(item.price)} each</p>
            <div className="actions">
              <button
                aria-label={`Decrease ${item.name}`}
                disabled={busy}
                onClick={() => update(item.productId, item.quantity - 1)}
              >
                −
              </button>
              <label>
                Quantity{" "}
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={item.quantity}
                  disabled={busy}
                  onChange={(e) =>
                    update(item.productId, Number(e.target.value))
                  }
                />
              </label>
              <button
                aria-label={`Increase ${item.name}`}
                disabled={busy || item.quantity >= 99}
                onClick={() => update(item.productId, item.quantity + 1)}
              >
                +
              </button>
              <button disabled={busy} onClick={() => remove(item.productId)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
      {!cart.length && (
        <p>
          Your cart is empty. <Link to="/products">Browse products</Link>
        </p>
      )}
      <div className="panel">
        <label htmlFor="discount-code">Discount code</label>
        <input
          id="discount-code"
          value={code}
          disabled={busy}
          onChange={(e) => setCode(e.target.value)}
          placeholder="WELCOME10 or CAMPUS50"
        />
        <button
          id="apply-discount"
          disabled={busy || !cart.length}
          onClick={() => {
            setApplied(code.trim().toUpperCase());
            setRevision((v) => v + 1);
          }}
        >
          Apply discount
        </button>
        {cart.length > 0 && !ready && !error && (
          <p role="status">Calculating totals…</p>
        )}
        <dl>
          <dt>Subtotal</dt>
          <dd id="cart-subtotal">
            {ready
              ? formatPrice(quote!.subtotal)
              : cart.length
                ? "—"
                : formatPrice(0)}
          </dd>
          <dt>Discount</dt>
          <dd id="cart-discount">
            {ready
              ? formatPrice(quote!.discount)
              : cart.length
                ? "—"
                : formatPrice(0)}
          </dd>
          <dt>Total</dt>
          <dd id="cart-total">
            {ready
              ? formatPrice(quote!.total)
              : cart.length
                ? "—"
                : formatPrice(0)}
          </dd>
        </dl>
        {error && (
          <p id="cart-error" className="error" role="alert">
            {error}{" "}
            <button disabled={busy} onClick={() => setRevision((v) => v + 1)}>
              Recalculate
            </button>
          </p>
        )}
        <button
          id="checkout-button"
          disabled={
            !cart.length ||
            !ready ||
            busy ||
            code.trim().toUpperCase() !== applied
          }
          onClick={checkout}
        >
          {busy ? "Placing order…" : "Checkout"}
        </button>
      </div>
    </section>
  );
}
