import { describe, it, expect } from "vitest";
import {
  calculateInterpolatedStep,
  getTimelineSteps,
} from "@/components/BuffProgressCard";

describe("BuffProgressCard Helpers & Real Data Truth", () => {
  it("strictly reflects server delivered count without synthetic inflation", () => {
    // Current is 50, server truth is 100
    const step = calculateInterpolatedStep(50, 100, 1000, 900, "IN_PROGRESS");
    expect(step).toBe(100);
  });

  it("clamps server delivered count to maximum total quantity", () => {
    const step = calculateInterpolatedStep(0, 1200, 1000, 0, "IN_PROGRESS");
    expect(step).toBe(1000);
  });

  it("jumps to 100% total when completed", () => {
    const step = calculateInterpolatedStep(450, 450, 500, 50, "COMPLETED");
    expect(step).toBe(500);
  });

  it("generates correct 4-stage timeline steps for active order with scanned start count", () => {
    const runningSteps = getTimelineSteps("IN_PROGRESS", 5048, 0, 1110);
    expect(runningSteps).toHaveLength(4);
    expect(runningSteps[0].status).toBe("done"); // Tiếp nhận đơn
    expect(runningSteps[1].status).toBe("done"); // Quét số lượng gốc (đã có số gốc > 0)
    expect(runningSteps[1].desc).toContain("5.048");
    expect(runningSteps[2].status).toBe("active"); // Đang đẩy tương tác
    expect(runningSteps[2].desc).toContain("1.110");
    expect(runningSteps[3].status).toBe("pending"); // Hoàn tất đơn hàng
  });

  it("marks step 2 as active with pending message when startCount has not been scanned yet", () => {
    const initSteps = getTimelineSteps("INITIALIZING", 0, 1000, 0);
    expect(initSteps[1].status).toBe("active");
    expect(initSteps[1].desc).toContain("Đang kết nối & quét");
  });

  it("marks all timeline steps as done when order is COMPLETED", () => {
    const completedSteps = getTimelineSteps("COMPLETED", 5048, 0, 1110);
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
