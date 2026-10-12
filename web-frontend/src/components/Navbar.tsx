import { Link } from 'react-router-dom';

/** TODO (task F4): show the logged-in user's name (#nav-user), cart count (#nav-cart-count) and a logout button (#nav-logout). */
export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/products" className="brand">
        CampusMart
      </Link>
      <nav>
        <Link to="/products">Products</Link>
        <Link to="/cart">Cart</Link>
        <Link to="/orders">Orders</Link>
      </nav>
    </header>
  );
}
