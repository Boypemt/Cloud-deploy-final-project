import { useEffect, useState } from "react";
import { listOrders, cancelOrder, type Order } from "../api/orders";
import { formatPrice } from "../utils/format";
import { errorMessage } from "../utils/validation";
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listOrders(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setOrders(result);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  async function cancel(id: string) {
    setBusy(id);
    setError("");
    try {
      const updated = await cancelOrder(id);
      setOrders((current) =>
        current.map((order) => (order.id === id ? updated : order)),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }
  return (
    <section id="orders-page">
      <h1>My orders</h1>
      {loading && <p role="status">Loading orders…</p>}
      {error && (
        <p className="error" role="alert">
          {error}{" "}
          <button onClick={() => setRevision((v) => v + 1)}>Retry</button>
        </p>
      )}
      <div id="order-list">
        {orders.map((order) => (
          <article
            className="order-row panel"
            data-order-id={order.id}
            key={order.id}
          >
            <h2>Order {order.id}</h2>
            <p>
              <time dateTime={order.createdAt}>
                {new Date(order.createdAt).toLocaleString()}
              </time>{" "}
              · <strong className="order-status">{order.status}</strong>
            </p>
            <ul>
              {order.items.map((item) => (
                <li key={item.productId}>
                  {item.name} × {item.quantity} — {formatPrice(item.lineTotal)}
                </li>
              ))}
            </ul>
            <p>
              Subtotal {formatPrice(order.subtotal)} · Discount{" "}
              {formatPrice(order.discount)}
              {order.discountCode ? ` (${order.discountCode})` : ""}
            </p>
            <p>
              <strong>Total {formatPrice(order.total)}</strong>
            </p>
            {order.status === "PLACED" && (
              <button
                className="cancel-order"
                disabled={Boolean(busy)}
                onClick={() => cancel(order.id)}
              >
                {busy === order.id ? "Cancelling…" : "Cancel order"}
              </button>
            )}
          </article>
        ))}
      </div>
      {!loading && !error && !orders.length && <p>No orders yet.</p>}
    </section>
  );
}
