import { describe, expect, it } from "vitest";
import { validateLoginForm } from "../src/utils/validation";
describe("UT-WEB-01 login validation", () => {
  it.each(["", "  ", "abc", "a@", "a b@example.com"])(
    "rejects email %j",
    (email) => {
      expect(
        validateLoginForm({ email, password: "secret123" }).email,
      ).toBeTruthy();
    },
  );
  it("requires password", () => {
    expect(
      validateLoginForm({ email: "demo@campusmart.local", password: "" })
        .password,
    ).toBeTruthy();
  });
  it("accepts valid input", () => {
    expect(
      validateLoginForm({
        email: "demo@campusmart.local",
        password: "secret123",
      }),
    ).toEqual({});
  });
});
