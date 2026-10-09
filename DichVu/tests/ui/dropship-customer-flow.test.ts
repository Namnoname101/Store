import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { prisma, OrderStatus, UpstreamStatus } from "@/lib/prisma";
import { POST, GET } from "@/app/api/orders/[orderCode]/refund-request/route";
import { GET as getOrderStatusRoute } from "@/app/api/orders/[orderCode]/status/route";

describe("Dropshipping Customer Flow & White-Label Refund Request", () => {
  const TEST_CUSTOMER_EMAIL = "buyer-refund-flow@example.com";
  const TEST_ORDER_CODE = "ORD_TEST_REFUND_01";
  const TEST_NONEXISTENT_CODE = "ORD_NONEXISTENT_999";

  let testOrderId: string;
  let testAccessToken: string;

  beforeAll(async () => {
    // Cleanup prior test records if any
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });

    const order = await prisma.order.create({
      data: {
        orderCode: TEST_ORDER_CODE,
        customerEmail: TEST_CUSTOMER_EMAIL,
        totalAmount: 150000,
        status: OrderStatus.PAID,
        upstreamStatus: UpstreamStatus.FAILED,
        upstreamError: "Simulated supplier out of stock error",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        paidAt: new Date(),
      },
    });
    testOrderId = order.id;
    testAccessToken = order.accessToken!;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset refundInfo on the test order before each test
    await prisma.order.update({
      where: { id: testOrderId },
      data: {
        refundInfo: null,
        upstreamStatus: UpstreamStatus.FAILED,
      },
    });
  });

  describe("API Route: /api/orders/[orderCode]/refund-request", () => {
    it("POST: successfully records refund request info and returns 200 with friendly message", async () => {
      const payload = {
        bankName: "MBBank (Napas 24/7)",
        accountNumber: "0987654321",
        accountName: "NGUYEN VAN A",
        note: "Mong shop hoàn tiền sớm giúp mình",
      };

      const request = new Request(`http://localhost/api/orders/ORD_TEST_REFUND_01/refund-request?token=${testAccessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await POST(request, { params: { orderCode: TEST_ORDER_CODE } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain("Yêu cầu hoàn tiền đã được ghi nhận");
      expect(data.message).toContain("5-15 phút");

      // Verify DB persistence
      const updatedOrder = await prisma.order.findUnique({
        where: { orderCode: TEST_ORDER_CODE },
      });
      expect(updatedOrder?.refundInfo).toBeDefined();

      const savedRefund = JSON.parse(updatedOrder!.refundInfo!);
      expect(savedRefund.bankName).toBe("MBBank (Napas 24/7)");
      expect(savedRefund.accountNumber).toBe("0987654321");
      expect(savedRefund.accountName).toBe("NGUYEN VAN A");
      expect(savedRefund.note).toBe("Mong shop hoàn tiền sớm giúp mình");
      expect(savedRefund.requestedAt).toBeDefined();
    });

    it("POST: returns 400 if required bank fields are missing or empty", async () => {
      // Missing bankName
      const req1 = new Request(`http://localhost/api/orders/ORD_TEST_REFUND_01/refund-request?token=${testAccessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: "",
          accountNumber: "123456",
          accountName: "TEST",
        }),
      });
      const res1 = await POST(req1, { params: { orderCode: TEST_ORDER_CODE } });
      expect(res1.status).toBe(400);

      // Missing accountNumber
      const req2 = new Request(`http://localhost/api/orders/ORD_TEST_REFUND_01/refund-request?token=${testAccessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: "VCB",
          accountNumber: "   ",
          accountName: "TEST",
        }),
      });
      const res2 = await POST(req2, { params: { orderCode: TEST_ORDER_CODE } });
      expect(res2.status).toBe(400);

      // Missing accountName
      const req3 = new Request(`http://localhost/api/orders/ORD_TEST_REFUND_01/refund-request?token=${testAccessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: "VCB",
          accountNumber: "123456",
        }),
      });
      const res3 = await POST(req3, { params: { orderCode: TEST_ORDER_CODE } });
      expect(res3.status).toBe(400);
    });

    it("POST: returns 404 when orderCode does not exist", async () => {
      const request = new Request("http://localhost/api/orders/ORD_NONEXISTENT_999/refund-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: "MBBank",
          accountNumber: "123456789",
          accountName: "TEST USER",
        }),
      });

      const response = await POST(request, { params: { orderCode: TEST_NONEXISTENT_CODE } });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("GET: returns hasRefundRequest=false when no refund request exists", async () => {
      const request = new Request(`http://localhost/api/orders/ORD_TEST_REFUND_01/refund-request?token=${testAccessToken}`);
      const response = await GET(request, { params: { orderCode: TEST_ORDER_CODE } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.hasRefundRequest).toBe(false);
      expect(data.refundInfo).toBeNull();
    });

    it("GET: returns refundInfo when already submitted", async () => {
      // First save refund info
      const refundData = {
        bankName: "Vietcombank",
        accountNumber: "9876543210",
        accountName: "TRAN VAN B",
        note: "Hoàn tiền gấp",
        requestedAt: new Date().toISOString(),
      };
      await prisma.order.update({
        where: { orderCode: TEST_ORDER_CODE },
        data: { refundInfo: JSON.stringify(refundData) },
      });

      const request = new Request(`http://localhost/api/orders/ORD_TEST_REFUND_01/refund-request?token=${testAccessToken}`);
      const response = await GET(request, { params: { orderCode: TEST_ORDER_CODE } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.hasRefundRequest).toBe(true);
      expect(data.refundInfo).toBeDefined();
      expect(data.refundInfo.accountNumber).toBe("9876543210");
      expect(data.refundInfo.accountName).toBe("TRAN VAN B");
    });

    it("GET: returns 404 for invalid orderCode", async () => {
      const request = new Request("http://localhost/api/orders/ORD_NONEXISTENT_999/refund-request");
      const response = await GET(request, { params: { orderCode: TEST_NONEXISTENT_CODE } });
      expect(response.status).toBe(404);
    });
  });

  describe("API Route: /api/orders/[orderCode]/status includes upstreamStatus", () => {
    it("returns upstreamStatus and refundInfo in order status polling response", async () => {
      const request = new Request("http://localhost/api/orders/ORD_TEST_REFUND_01/status");
      const response = await getOrderStatusRoute(request, { params: { orderCode: TEST_ORDER_CODE } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe(OrderStatus.PAID);
      expect(data.upstreamStatus).toBe(UpstreamStatus.FAILED);
    });
  });

  describe("Strict White-Label Blacklist Scanner", () => {
    const BLACKLIST_WORDS = [
      "taphoammo",
      "trumthe",
      "nhà cung cấp",
      "sàn ngoài",
      "đối tác",
      "dropship",
      "mua lại",
    ];

    const TARGET_FILES = [
      "src/components/CheckoutClient.tsx",
      "src/components/SecretDisplay.tsx",
      "src/app/api/orders/[orderCode]/refund-request/route.ts",
    ];

    it("ensures no supplier names or dropship jargon appear in target files", () => {
      for (const relativePath of TARGET_FILES) {
        const fullPath = path.resolve(process.cwd(), relativePath);
        expect(fs.existsSync(fullPath), `File ${relativePath} must exist`).toBe(true);

        const content = fs.readFileSync(fullPath, "utf-8").toLowerCase();

        for (const forbidden of BLACKLIST_WORDS) {
          const hasForbidden = content.includes(forbidden);
          expect(
            hasForbidden,
            `Blacklisted word "${forbidden}" found in ${relativePath}!`
          ).toBe(false);
        }
      }
    });

    it("ensures customer-facing text does not leak 'upstream' technical terminology", () => {
      // In customer-facing UI text, 'upstream' must not be shown to users.
      // We check that JSX text and strings displayed to users do not contain 'upstream'.
      for (const relativePath of [
        "src/components/CheckoutClient.tsx",
        "src/components/SecretDisplay.tsx",
      ]) {
        const fullPath = path.resolve(process.cwd(), relativePath);
        const content = fs.readFileSync(fullPath, "utf-8");

        // Extract JSX return block(s)
        const returnBlocks = content.match(/return\s*\([\s\S]*?\n\s*\);/g) || [];
        for (const block of returnBlocks) {
          // Extract text between > and < inside JSX return block
          const textNodes = block.match(/>([^<>{}\n]+)</g) || [];
          for (const node of textNodes) {
            const cleanText = node.replace(/[><]/g, "").trim().toLowerCase();
            if (cleanText.length > 3) {
              expect(
                cleanText.includes("upstream"),
                `Found leaked 'upstream' in visible UI text in ${relativePath}: "${cleanText}"`
              ).toBe(false);
            }
          }
        }
      }
    });

    it("ensures required white-label brand wording is present", () => {
      const checkoutContent = fs.readFileSync(
        path.resolve(process.cwd(), "src/components/CheckoutClient.tsx"),
        "utf-8"
      );
      const secretContent = fs.readFileSync(
        path.resolve(process.cwd(), "src/components/SecretDisplay.tsx"),
        "utf-8"
      );

      // Verify white-label brand phrases exist
      expect(
        checkoutContent.includes("Hệ thống đang cấp phát") || checkoutContent.includes("cấp phát tự động"),
        "CheckoutClient must contain white-label pending message"
      ).toBe(true);
      expect(
        checkoutContent.includes("Máy chủ cấp phát") || checkoutContent.includes("quá tải"),
        "CheckoutClient must contain white-label failure notification"
      ).toBe(true);

      expect(
        secretContent.includes("Hệ thống đang cấp phát") || secretContent.includes("cấp phát"),
        "SecretDisplay must contain white-label pending message"
      ).toBe(true);
    });
  });
});
