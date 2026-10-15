import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage, validateLoginForm } from "../utils/validation";
export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    const errors = validateLoginForm({ email, password });
    if (
      !name.trim() ||
      name.trim().length > 50 ||
      password.length < 6 ||
      Object.keys(errors).length
    ) {
      setError(
        "Enter a name (1–50 characters), valid email, and password of at least 6 characters.",
      );
      return;
    }
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password);
      setSuccess(true);
      setPassword("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-panel" id="register-page">
      <h1>Create an account</h1>
      <form onSubmit={submit} noValidate>
        <label htmlFor="register-name">Name</label>
        <input
          id="register-name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          required
        />
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {error && (
          <p id="register-error" className="error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p id="register-success" role="status">
            Account created. <Link to="/login">Login</Link> to continue.
          </p>
        )}
        <button id="register-submit" disabled={busy}>
          {busy ? "Creating…" : "Register"}
        </button>
      </form>
      <p>
        <Link to="/login">Back to login</Link>
      </p>
    </section>
  );
}
