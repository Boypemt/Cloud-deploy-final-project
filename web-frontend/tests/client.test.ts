import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError, TOKEN_KEY } from "../src/api/client";
afterEach(() => vi.unstubAllGlobals());
function setup(status: number, body: unknown) {
  const dispatchEvent = vi.fn();
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => (key === TOKEN_KEY ? "test-token" : null)),
  });
  vi.stubGlobal("window", { dispatchEvent });
  vi.stubGlobal("fetch", fetchMock);
  return { dispatchEvent, fetchMock };
}
describe("API client session handling", () => {
  it("sends bearer token and JSON headers with relative API path", async () => {
    const { fetchMock } = setup(200, { ok: true });
    expect(
      await apiFetch("/api/orders/quote", { method: "POST", body: "{}" }),
    ).toEqual({ ok: true });
    const [path, options] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/orders/quote");
    expect(options.headers.get("Authorization")).toBe("Bearer test-token");
    expect(options.headers.get("Content-Type")).toBe("application/json");
  });
  it("notifies AuthContext on unauthorized responses and preserves backend error", async () => {
    const { dispatchEvent } = setup(401, { message: "Unauthorized" });
    await expect(apiFetch("/api/orders")).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
    expect(dispatchEvent.mock.calls[0][0].type).toBe("campusmart:unauthorized");
  });
  it("keeps session on stock conflicts", async () => {
    const { dispatchEvent } = setup(409, { message: "Insufficient stock" });
    await expect(apiFetch("/api/orders")).rejects.toBeInstanceOf(ApiError);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
  it("ignores an unauthorized result from a request already cancelled", async () => {
    const { dispatchEvent } = setup(401, { message: "Unauthorized" });
    const controller = new AbortController();
    controller.abort();
    await expect(
      apiFetch("/api/auth/me", { signal: controller.signal }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});
