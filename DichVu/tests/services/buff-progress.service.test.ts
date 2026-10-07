import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBuffProgress } from "@/services/buff-progress.service";
import { prisma } from "@/lib/prisma";
import * as adapterRegistry from "@/services/suppliers/adapter.registry";

vi.mock("@/lib/prisma", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    prisma: {
      order: {
        findUnique: vi.fn(),
      },
    },
  };
});

describe("Buff Progress Service", () => {
  const mockAdapter = {
    buyProduct: vi.fn(),
    checkOrderStatus: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(adapterRegistry, "getSupplierAdapter").mockReturnValue(mockAdapter as any);
  });

  it("returns isBuffOrder: false if order is not found", async () => {
    (prisma.order.findUnique as any).mockResolvedValue(null);

    const result = await getBuffProgress("ORD_NON_EXISTENT");
    expect(result).toEqual({
      orderCode: "ORD_NON_EXISTENT",
      isBuffOrder: false,
      error: "Không tìm thấy đơn hàng",
    });
  });

  it("returns isBuffOrder: false if order has no upstream dropship buff mapping", async () => {
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "ord-1",
      orderCode: "ORD123456",
      status: "PAID",
      upstreamOrderId: null,
      customerNote: null,
      createdAt: new Date(),
      orderItems: [
        {
          quantity: 1,
          product: {
            title: "Tài khoản Canva Pro",
            fulfillmentType: "LOCAL_STOCK",
            supplierMapping: null,
          },
        },
      ],
    });

    const result = await getBuffProgress("ORD123456");
    expect(result.isBuffOrder).toBe(false);
  });

  it("returns formatted live progress when upstream order is in progress", async () => {
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "ord-2",
      orderCode: "ORD888999",
      status: "PAID",
      upstreamOrderId: "998877",
      customerNote: "https://facebook.com/profile.php?id=100012345678",
      createdAt: new Date("2026-10-07T08:00:00Z"),
      updatedAt: new Date("2026-10-07T08:05:00Z"),
      orderItems: [
        {
          quantity: 1000,
          product: {
            title: "Tăng Follow Facebook Uy Tín",
            fulfillmentType: "API_DROPSHIP",
            supplierMapping: {
              supplier: {
                id: "supp-1",
                type: "HACKTIM",
                baseUrl: "https://hacktim.com/api/v2",
                apiKey: "secret-key",
              },
            },
          },
        },
      ],
    });

    mockAdapter.checkOrderStatus.mockResolvedValue({
      success: true,
      orderId: "998877",
      status: "IN_PROGRESS",
      startCount: 1500,
      remains: 300,
    });

    const result = await getBuffProgress("ORD888999");

    expect(result.isBuffOrder).toBe(true);
    expect(result.orderCode).toBe("ORD888999");
    expect(result.totalQuantity).toBe(1000);
    expect(result.startCount).toBe(1500);
    expect(result.remains).toBe(300);
    expect(result.deliveredCount).toBe(700);
    expect(result.progressPercent).toBe(70);
    expect(result.status).toBe("IN_PROGRESS");
    expect(result.targetLink).toBe("https://facebook.com/profile.php?id=100012345678");
    expect(result.providerName).toBe("Máy chủ cấp phát DigiStore");
    expect(result.serverOrderId).toBe("998877");
    // Ensure 100% white-label (no upstream mentions)
    const jsonStr = JSON.stringify(result).toLowerCase();
    expect(jsonStr).not.toContain("hacktim");
    expect(jsonStr).not.toContain("upstream");
  });

  it("handles COMPLETED status correctly with 100% progress", async () => {
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "ord-3",
      orderCode: "ORD333444",
      status: "PAID",
      upstreamOrderId: "112233",
      customerNote: "https://facebook.com/my-post",
      createdAt: new Date(),
      updatedAt: new Date(),
      orderItems: [
        {
          quantity: 500,
          product: {
            title: "Tăng Like Facebook",
            fulfillmentType: "API_DROPSHIP",
            supplierMapping: {
              supplier: {
                type: "HACKTIM",
                baseUrl: "https://hacktim.com/api/v2",
                apiKey: "secret",
              },
            },
          },
        },
      ],
    });

    mockAdapter.checkOrderStatus.mockResolvedValue({
      success: true,
      orderId: "112233",
      status: "COMPLETED",
      startCount: 200,
      remains: 0,
    });

    const result = await getBuffProgress("ORD333444");

    expect(result.isBuffOrder).toBe(true);
    expect(result.status).toBe("COMPLETED");
    expect(result.progressPercent).toBe(100);
    expect(result.deliveredCount).toBe(500);
  });
});
