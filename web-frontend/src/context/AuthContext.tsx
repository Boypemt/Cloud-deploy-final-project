import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import * as auth from "../api/auth";
import { TOKEN_KEY } from "../api/client";
import { errorMessage } from "../utils/validation";
interface AuthState {
  user: auth.User | null;
  token: string | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  register: typeof auth.register;
  logout: () => void;
  retry: () => void;
}
const Context = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<auth.User | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("campusmart_cart");
    setToken(null);
    setUser(null);
    setLoading(false);
    setError("");
    window.dispatchEvent(new Event("campusmart:logout"));
  }, []);
  useEffect(() => {
    const unauthorized = () => logout();
    const sync = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY) {
        setToken(event.newValue);
        setUser(null);
      }
    };
    window.addEventListener("campusmart:unauthorized", unauthorized);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("campusmart:unauthorized", unauthorized);
      window.removeEventListener("storage", sync);
    };
  }, [logout]);
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    auth
      .getMe(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setUser(result.user);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, attempt]);
  async function login(email: string, password: string) {
    const result = await auth.login(email.trim(), password);
    localStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    setToken(result.token);
    setError("");
  }
  return (
    <Context.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register: auth.register,
        logout,
        retry: () => setAttempt((v) => v + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error("AuthProvider missing");
  return context;
}
