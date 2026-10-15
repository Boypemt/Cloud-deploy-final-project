import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  addToCart,
  updateQuantity,
  removeFromCart,
  readCart,
  type CartItem,
} from "../utils/cart";
const CART_KEY = "campusmart_cart";
interface State {
  cart: CartItem[];
  add: (product: Omit<CartItem, "quantity">) => void;
  update: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}
const Context = createContext<State | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState(() =>
    readCart(localStorage.getItem(CART_KEY)),
  );
  useEffect(() => {
    if (cart.length) localStorage.setItem(CART_KEY, JSON.stringify(cart));
    else localStorage.removeItem(CART_KEY);
  }, [cart]);
  useEffect(() => {
    const clear = () => setCart([]);
    const sync = (event: StorageEvent) => {
      if (event.key === CART_KEY) setCart(readCart(event.newValue));
    };
    window.addEventListener("campusmart:logout", clear);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("campusmart:logout", clear);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return (
    <Context.Provider
      value={{
        cart,
        add: (product) => setCart((c) => addToCart(c, product)),
        update: (id, quantity) =>
          setCart((c) => updateQuantity(c, id, quantity)),
        remove: (id) => setCart((c) => removeFromCart(c, id)),
        clear: () => setCart([]),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCart() {
  const context = useContext(Context);
  if (!context) throw new Error("CartProvider missing");
  return context;
}
