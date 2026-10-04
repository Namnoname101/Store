import { describe, it, expect } from "vitest";

describe("Floating Support Widget", () => {
  it("should export FloatingSupport component", async () => {
    const mod = await import("@/components/FloatingSupport");
    expect(mod.default).toBeDefined();
  });
});
