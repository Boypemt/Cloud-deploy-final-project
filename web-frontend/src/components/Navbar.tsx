import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { cartCount } from "../utils/cart";
export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart, clear } = useCart();
  const navigate = useNavigate();
  return (
    <>
      <div className="announcement">
        A little campus joy, every day.{" "}
        <span>Student essentials, all in one place.</span>
      </div>
      <header className="navbar">
        <Link to="/products" className="brand">
          <span className="brand-mark" aria-hidden="true">
            c<span>m</span>
            <i>✦</i>
          </span>
          <span>
            campus<span className="brand-light">mart</span>
            <small>MADE FOR CAMPUS LIFE</small>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {user ? (
            <>
              <NavLink to="/products">The shop</NavLink>
              <NavLink to="/orders">My orders</NavLink>
              <NavLink className="bag-link" to="/cart">
                <svg
                  viewBox="0 0 24 24"
                  width="19"
                  height="19"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="M5 7h14l1 14H4L5 7Z" />
                  <path d="M8 8V6a4 4 0 0 1 8 0v2" />
                </svg>{" "}
                My bag <span id="nav-cart-count">{cartCount(cart)}</span>
              </NavLink>
              <div className="user-menu">
                <span className="avatar" aria-hidden="true">
                  {user.name.slice(0, 1)}
                </span>
                <span id="nav-user">{user.name.replace(" (Preview)", "")}</span>
                <button
                  id="nav-logout"
                  onClick={() => {
                    clear();
                    logout();
                    navigate("/login");
                  }}
                >
                  Log out ↗
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Join CampusMart ↗</NavLink>
            </>
          )}
        </nav>
      </header>
    </>
  );
}
