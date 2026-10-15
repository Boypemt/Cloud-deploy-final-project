import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateLoginForm, errorMessage } from "../utils/validation";
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const errors = validateLoginForm({ email, password });
    if (Object.keys(errors).length) {
      setError(Object.values(errors).join(". "));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/products");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-panel" id="login-page">
      <h1>Welcome to CampusMart</h1>
      <p className="muted">Sign in to shop for your campus essentials.</p>
      <form onSubmit={submit} noValidate>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p id="login-error" className="error" role="alert">
            {error}
          </p>
        )}
        <button id="login-submit" disabled={busy}>
          {busy ? "Signing in…" : "Login"}
        </button>
      </form>
      <p>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}
