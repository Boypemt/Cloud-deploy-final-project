/**
 * Small fetch wrapper used by every page.
 * - Always calls relative URLs (/api/...) so the same build works behind Vite (dev) and nginx (Docker/K8s).
 * - Adds "Authorization: Bearer <token>" when a token is stored.
 * - Throws ApiError with the backend's { message } on non-2xx responses.
 */
export const TOKEN_KEY = "campusmart_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...options, headers });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && !options.signal?.aborted)
      window.dispatchEvent(new Event("campusmart:unauthorized"));
    throw new ApiError(
      res.status,
      body?.message ?? `Request failed (${res.status})`,
    );
  }
  return body as T;
}
