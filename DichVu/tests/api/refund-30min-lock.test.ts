import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, OrderStatus, UpstreamStatus } from "@/lib/prisma";
import { POST, GET } from "@/app/api/orders/[orderCode]/refund-request/route";

describe("30-Minute Refund Lock Rule: /api/orders/[orderCode]/refund-request", () => {
  const TEST_EMAIL = "refund_30min_test@daitruong.com";
  const ORDER_RECENT = "ORD_30MIN_RECENT";
  const ORDER_MATURE = "ORD_30MIN_MATURE";
  const ORDER_COMPLETED = "ORD_30MIN_COMPLETED";

  let recentToken = "";
  let matureToken = "";
  let completedToken = "";

  beforeAll(async () => {
    // Clean up any leftovers
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_EMAIL },
    });

    // 1. Fresh order paid 5 minutes ago (< 30 minutes)
    const recent = await prisma.order.create({
      data: {
        orderCode: ORDER_RECENT,
        customerEmail: TEST_EMAIL,
        totalAmount: 50000,
        status: OrderStatus.PAID,
        upstreamStatus: UpstreamStatus.FAILED,
        paidAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    recentToken = recent.accessToken!;

    // 2. Mature order paid 35 minutes ago (> 30 minutes)
    const mature = await prisma.order.create({
      data: {
        orderCode: ORDER_MATURE,
        customerEmail: TEST_EMAIL,
        totalAmount: 100000,
        status: OrderStatus.PAID,
        upstreamStatus: UpstreamStatus.FAILED,
        paidAt: new Date(Date.now() - 35 * 60 * 1000), // 35 mins ago
        createdAt: new Date(Date.now() - 35 * 60 * 1000),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    matureToken = mature.accessToken!;

    // 3. Completed order paid 40 minutes ago (Already delivered)
    const completed = await prisma.order.create({
      data: {
        orderCode: ORDER_COMPLETED,
        customerEmail: TEST_EMAIL,
        totalAmount: 120000,
        status: OrderStatus.PAID,
        upstreamStatus: UpstreamStatus.COMPLETED,
        paidAt: new Date(Date.now() - 40 * 60 * 1000),
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    completedToken = completed.accessToken!;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_EMAIL },
    });
    await prisma.$disconnect();
  });

  describe("GET /api/orders/[orderCode]/refund-request", () => {
    it("returns canRequestRefund = false and positive remainingSeconds for orders < 30 mins", async () => {
      const req = new Request(`http://localhost/api/orders/${ORDER_RECENT}/refund-request?token=${recentToken}`);
      const res = await GET(req, { params: { orderCode: ORDER_RECENT } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.hasRefundRequest).toBe(false);
      expect(data.canRequestRefund).toBe(false);
      expect(data.remainingSeconds).toBeGreaterThan(0);
      expect(data.remainingSeconds).toBeLessThanOrEqual(25 * 60 + 5);
    });

    it("returns canRequestRefund = true and remainingSeconds = 0 for orders > 30 mins", async () => {
      const req = new Request(`http://localhost/api/orders/${ORDER_MATURE}/refund-request?token=${matureToken}`);
      const res = await GET(req, { params: { orderCode: ORDER_MATURE } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.hasRefundRequest).toBe(false);
      expect(data.canRequestRefund).toBe(true);
      expect(data.remainingSeconds).toBe(0);
    });
  });

  describe("POST /api/orders/[orderCode]/refund-request", () => {
    it("REJECTS refund request with 400 when order was paid less than 30 minutes ago", async () => {
      const payload = {
        bankName: "MBBank",
        accountNumber: "0987654321",
        accountName: "NGUYEN VAN A",
        note: "Mong shop hoàn tiền sớm",
      };

      const req = new Request(`http://localhost/api/orders/${ORDER_RECENT}/refund-request?token=${recentToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: { orderCode: ORDER_RECENT } });
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("30 phút");
      expect(data.canRequestRefund).toBe(false);
      expect(data.remainingMinutes).toBeGreaterThan(0);
    });

    it("ACCEPTS refund request with 200 when order was paid more than 30 minutes ago", async () => {
      const payload = {
        bankName: "Techcombank",
        accountNumber: "1903678912345",
        accountName: "TRAN VAN B",
        note: "Đã quá 30 phút chưa có key, xin hoàn tiền",
      };

      const req = new Request(`http://localhost/api/orders/${ORDER_MATURE}/refund-request?token=${matureToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: { orderCode: ORDER_MATURE } });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain("Yêu cầu hoàn tiền đã được ghi nhận");

      // Verify in DB
      const dbOrder = await prisma.order.findUnique({
        where: { orderCode: ORDER_MATURE },
      });
      expect(dbOrder?.refundInfo).toBeDefined();
      const info = JSON.parse(dbOrder!.refundInfo!);
      expect(info.bankName).toBe("Techcombank");
      expect(info.accountNumber).toBe("1903678912345");
      expect(info.accountName).toBe("TRAN VAN B");
    });

    it("REJECTS refund request for COMPLETED orders even if older than 30 minutes", async () => {
      const payload = {
        bankName: "Techcombank",
        accountNumber: "1903678912345",
        accountName: "TRAN VAN B",
      };

      const req = new Request(`http://localhost/api/orders/${ORDER_COMPLETED}/refund-request?token=${completedToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: { orderCode: ORDER_COMPLETED } });
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("hoàn tất cấp phát");
    });

    it("REJECTS refund request if guest token is invalid", async () => {
      const payload = {
        bankName: "Techcombank",
        accountNumber: "1903678912345",
        accountName: "TRAN VAN B",
      };

      const req = new Request(`http://localhost/api/orders/${ORDER_MATURE}/refund-request?token=INVALID_TOKEN`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await POST(req, { params: { orderCode: ORDER_MATURE } });
      expect(res.status).toBe(403);
    });
  });
});
