import { describe, it, expect } from "vitest";

describe("Admin Login Page & Layout", () => {
  it("should have login route and client page exported", async () => {
    const page = await import("@/app/admin/login/page");
    expect(page.default).toBeDefined();
  });
});
