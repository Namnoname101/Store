import { describe, it, expect } from "vitest";
import {
  calculateInterpolatedStep,
  getTimelineSteps,
} from "@/components/BuffProgressCard";

describe("BuffProgressCard Helpers & Interpolation Engine", () => {
  it("interpolates step smoothly towards server count when behind", () => {
    // Current is 50, server truth is 100
    const step = calculateInterpolatedStep(50, 100, 1000, 900, "IN_PROGRESS");
    expect(step).toBeGreaterThan(50);
    expect(step).toBeLessThanOrEqual(100);
  });

  it("simulates gentle micro-ticking when in progress", () => {
    // Current is equal to server count 100, remains is 900, total is 1000
    const step = calculateInterpolatedStep(100, 100, 1000, 900, "IN_PROGRESS");
    expect(step).toBeGreaterThan(100);
    // Should never exceed safe ceiling (total or serverDelivered + maxLocalCeiling)
    expect(step).toBeLessThanOrEqual(150);
  });

  it("jumps to 100% total when completed", () => {
    const step = calculateInterpolatedStep(450, 500, 500, 0, "COMPLETED");
    expect(step).toBe(500);
  });

  it("generates correct 4-stage timeline steps", () => {
    const runningSteps = getTimelineSteps("IN_PROGRESS", 1200, 300, 700);
    expect(runningSteps).toHaveLength(4);
    expect(runningSteps[0].status).toBe("done"); // Tiếp nhận đơn
    expect(runningSteps[1].status).toBe("done"); // Quét số lượng gốc
    expect(runningSteps[2].status).toBe("active"); // Đang đẩy tương tác
    expect(runningSteps[3].status).toBe("pending"); // Hoàn tất đơn hàng

    const completedSteps = getTimelineSteps("COMPLETED", 1200, 0, 1000);
    expect(completedSteps.every((s) => s.status === "done")).toBe(true);
  });

  it("contains zero mentions of supplier or upstream keywords in timeline labels", () => {
    const steps = getTimelineSteps("IN_PROGRESS", 500, 200, 800);
    const jsonStr = JSON.stringify(steps).toLowerCase();
    expect(jsonStr).not.toContain("hacktim");
    expect(jsonStr).not.toContain("upstream");
    expect(jsonStr).not.toContain("taphoammo");
  });
});
