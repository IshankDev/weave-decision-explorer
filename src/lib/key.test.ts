import { describe, expect, it } from "vitest";
import { isValidAnalyticsKey } from "./key";

describe("analytics key validation", () => {
  it("accepts only ra_ prefix", () => {
    expect(isValidAnalyticsKey("ra_abc")).toBe(true);
    expect(isValidAnalyticsKey("rk_abc")).toBe(false);
    expect(isValidAnalyticsKey("sk_abc")).toBe(false);
    expect(isValidAnalyticsKey("")).toBe(false);
  });
});
