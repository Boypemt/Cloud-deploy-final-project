import { describe, expect, it } from "vitest";
import { formatPrice } from "../src/utils/format";

describe("formatPrice (example unit test)", () => {
  it("formats with baht sign and 2 decimals", () => {
    expect(formatPrice(1234.5)).toBe("฿1,234.50");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("฿0.00");
  });
});
