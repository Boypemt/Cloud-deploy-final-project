import ProtectedRoute from "./components/ProtectedRoute";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductsPage from "./pages/ProductsPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Route>
          <Route path="*" element={<p>Page not found</p>} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div>
          <strong>
            campusmart<span>✦</span>
          </strong>
          <p>A little joy for your everyday campus life.</p>
        </div>
        <span>
          STUDY. SNACK. REPEAT.
          <br />
          <small>CampusMart · Your everyday campus store</small>
        </span>
      </footer>
    </>
  );
}
