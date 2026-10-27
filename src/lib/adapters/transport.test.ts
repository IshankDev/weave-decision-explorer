import { describe, expect, it } from "vitest";
import { isAllowedPath, validateRouterUrl } from "./transport";

describe("transport SSRF / allow-list", () => {
  it("allows only documented analytics paths", () => {
    expect(isAllowedPath("v1/analytics/routing-decisions")).toBe(true);
    expect(isAllowedPath("v1/analytics/schema")).toBe(true);
    expect(isAllowedPath("v1/analytics/models")).toBe(true);
    expect(isAllowedPath("v1/route")).toBe(false);
    expect(isAllowedPath("v1/admin")).toBe(false);
  });

  it("requires https and blocks private hosts", () => {
    expect(validateRouterUrl("https://router.workweave.ai").ok).toBe(true);
    expect(validateRouterUrl("http://evil.example").ok).toBe(false);
    expect(validateRouterUrl("https://127.0.0.1").ok).toBe(false);
    expect(validateRouterUrl("https://10.0.0.5").ok).toBe(false);
    expect(validateRouterUrl("https://192.168.1.1").ok).toBe(false);
  });

  it("allows http://localhost only in development", () => {
    expect(
      validateRouterUrl("http://localhost:8080", { nodeEnv: "development" }).ok,
    ).toBe(true);
    expect(
      validateRouterUrl("http://localhost:8080", { nodeEnv: "production" }).ok,
    ).toBe(false);
  });
});
