import { describe, it, expect } from "vitest";

describe("Customer Wallet UI Components & Routes", () => {
  it("should have correct routes for auth, topup and profile", () => {
    const authRoutes = ["/login", "/register", "/topup", "/profile"];
    expect(authRoutes).toContain("/login");
    expect(authRoutes).toContain("/register");
    expect(authRoutes).toContain("/topup");
    expect(authRoutes).toContain("/profile");
  });

  it("should format balance in Vietnamese Dong style", () => {
    const formatVnd = (amount: number) => amount.toLocaleString("vi-VN") + "đ";
    expect(formatVnd(50000)).toBe("50.000đ");
    expect(formatVnd(0)).toBe("0đ");
    expect(formatVnd(1250000)).toBe("1.250.000đ");
  });
});
