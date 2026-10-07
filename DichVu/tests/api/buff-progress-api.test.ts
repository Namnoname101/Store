import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/orders/[orderCode]/buff-progress/route";
import * as buffService from "@/services/buff-progress.service";

describe("GET /api/orders/[orderCode]/buff-progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if orderCode is empty", async () => {
    const res = await GET(new Request("http://localhost"), {
      params: { orderCode: "" },
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Mã đơn hàng không hợp lệ.");
  });

  it("returns 200 with buff progress data", async () => {
    vi.spyOn(buffService, "getBuffProgress").mockResolvedValue({
      orderCode: "ORD999888",
      isBuffOrder: true,
      status: "IN_PROGRESS",
      statusLabel: "Đang đẩy tương tác",
      totalQuantity: 1000,
      startCount: 50,
      remains: 200,
      deliveredCount: 800,
      progressPercent: 80,
      serviceName: "Tăng Like Facebook",
      providerName: "Máy chủ cấp phát DigiStore",
    });

    const res = await GET(new Request("http://localhost"), {
      params: { orderCode: "ORD999888" },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.isBuffOrder).toBe(true);
    expect(data.progressPercent).toBe(80);
    expect(data.deliveredCount).toBe(800);
    expect(data.providerName).toBe("Máy chủ cấp phát DigiStore");
  });
});
