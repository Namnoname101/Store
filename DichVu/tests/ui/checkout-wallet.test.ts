import { describe, it, expect } from "vitest";

describe("Checkout Wallet Integration Logic", () => {
  it("should determine whether wallet balance covers order total", () => {
    const checkCanPayWithWallet = (balance: number, total: number) => {
      return balance >= total;
    };

    expect(checkCanPayWithWallet(100000, 50000)).toBe(true);
    expect(checkCanPayWithWallet(50000, 50000)).toBe(true);
    expect(checkCanPayWithWallet(49999, 50000)).toBe(false);
    expect(checkCanPayWithWallet(0, 50000)).toBe(false);
  });

  it("should calculate missing balance needed for topup", () => {
    const calculateMissingBalance = (balance: number, total: number) => {
      return Math.max(0, total - balance);
    };

    expect(calculateMissingBalance(20000, 50000)).toBe(30000);
    expect(calculateMissingBalance(100000, 50000)).toBe(0);
  });
});
