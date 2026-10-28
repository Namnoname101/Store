import { describe, it, expect } from "vitest";
import { computeBuffMetrics } from "@/services/buff-progress.service";

describe("computeBuffMetrics - Real-time SMM Upstream Truth", () => {
  it("prevents fake 100% when SMM order is Pending with remains: 0 (The HackTim Bug)", () => {
    // When HackTim receives an order, it initially returns status: "Pending", start_count: 0, remains: 0
    const result = computeBuffMetrics({
      totalQuantity: 50,
      rawStatus: "Pending",
      serverStartCount: 0,
      serverRemains: 0,
    });

    expect(result.stage).toBe("INITIALIZING");
    expect(result.startCount).toBe(0);
    expect(result.remains).toBe(50);
    expect(result.deliveredCount).toBe(0);
    expect(result.progressPercent).toBe(0);
    expect(result.currentCount).toBeUndefined();
    expect(result.targetCount).toBeUndefined();
  });

  it("calculates real progress when upstream starts pushing and scans base followers", () => {
    // When HackTim bot starts, start_count is 120, remains is 35 (out of 50)
    const result = computeBuffMetrics({
      totalQuantity: 50,
      rawStatus: "In progress",
      serverStartCount: 120,
      serverRemains: 35,
    });

    expect(result.stage).toBe("IN_PROGRESS");
    expect(result.startCount).toBe(120);
    expect(result.deliveredCount).toBe(15);
    expect(result.remains).toBe(35);
    expect(result.progressPercent).toBe(30); // 15 / 50 = 30%
    expect(result.currentCount).toBe(135); // 120 + 15
    expect(result.targetCount).toBe(170); // 120 + 50
  });

  it("marks as 100% when upstream reports Completed", () => {
    const result = computeBuffMetrics({
      totalQuantity: 50,
      rawStatus: "Completed",
      serverStartCount: 120,
      serverRemains: 0,
    });

    expect(result.stage).toBe("COMPLETED");
    expect(result.startCount).toBe(120);
    expect(result.deliveredCount).toBe(50);
    expect(result.remains).toBe(0);
    expect(result.progressPercent).toBe(100);
    expect(result.currentCount).toBe(170);
    expect(result.targetCount).toBe(170);
  });

  it("handles Partial status properly with remaining refunded amount", () => {
    const result = computeBuffMetrics({
      totalQuantity: 100,
      rawStatus: "Partial",
      serverStartCount: 500,
      serverRemains: 40,
    });

    expect(result.stage).toBe("PARTIAL");
    expect(result.startCount).toBe(500);
    expect(result.deliveredCount).toBe(60);
    expect(result.remains).toBe(40);
    expect(result.progressPercent).toBe(60);
    expect(result.currentCount).toBe(560);
  });

  it("handles Cancelled status safely", () => {
    const result = computeBuffMetrics({
      totalQuantity: 50,
      rawStatus: "Cancelled",
      serverStartCount: 0,
      serverRemains: 50,
    });

    expect(result.stage).toBe("CANCELLED");
    expect(result.deliveredCount).toBe(0);
    expect(result.remains).toBe(50);
    expect(result.progressPercent).toBe(0);
  });
});
