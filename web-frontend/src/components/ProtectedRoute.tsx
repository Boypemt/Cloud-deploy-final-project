import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function ProtectedRoute() {
  const { token, user, loading, error, retry, logout } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <p role="status">Loading your session…</p>;
  if (!user)
    return (
      <section>
        <p role="alert" className="error">
          {error || "Unable to load your session"}
        </p>
        <button onClick={retry}>Retry</button>{" "}
        <button onClick={logout}>Log out</button>
      </section>
    );
  return <Outlet />;
}
