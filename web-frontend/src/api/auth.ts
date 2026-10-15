import { apiFetch } from "./client";
export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}
export const login = (email: string, password: string) =>
  apiFetch<{ token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
export const register = (name: string, email: string, password: string) =>
  apiFetch<{ user: User }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
export const getMe = (signal?: AbortSignal) =>
  apiFetch<{ user: User }>("/api/auth/me", { signal });
