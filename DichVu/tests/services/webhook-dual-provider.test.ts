import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import { POST as paymentWebhookPost, verifyPayOsSignature } from "@/app/api/webhooks/payment/route";
import { prisma, OrderStatus } from "@/lib/prisma";

describe("Webhook Dual-Provider Verification: SePay & PayOS", () => {
  const TEST_WEBHOOK_SECRET = "test-dual-provider-secret-key-999";
  const TEST_ORDER_CODE = `ORD_DUAL_${Date.now()}`;
  let origSecret: string | undefined;

  beforeAll(async () => {
    origSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    process.env.PAYMENT_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

    // Create a dummy test order
    await prisma.order.create({
      data: {
        orderCode: TEST_ORDER_CODE,
        totalAmount: 100000,
        status: OrderStatus.PENDING,
        expiresAt: new Date(Date.now() + 600000),
      },
    });
  });

  afterAll(async () => {
    if (origSecret) {
      process.env.PAYMENT_WEBHOOK_SECRET = origSecret;
    } else {
      delete process.env.PAYMENT_WEBHOOK_SECRET;
    }
    await prisma.order.deleteMany({
      where: { orderCode: TEST_ORDER_CODE },
    });
  });

  describe("1. PayOS Checksum Signature Helper", () => {
    it("correctly calculates and validates payOS sorted data signature", () => {
      const data = {
        orderCode: 12345,
        amount: 50000,
        description: "Payment for order",
      };
      // Sorted string: amount=50000&description=Payment for order&orderCode=12345
      const sortedStr = "amount=50000&description=Payment for order&orderCode=12345";
      const validSig = crypto.createHmac("sha256", TEST_WEBHOOK_SECRET).update(sortedStr).digest("hex");

      expect(verifyPayOsSignature(data, validSig, TEST_WEBHOOK_SECRET)).toBe(true);
      expect(verifyPayOsSignature(data, "invalid-sig", TEST_WEBHOOK_SECRET)).toBe(false);
    });
  });

  describe("2. SePay Header Authentication", () => {
    it("authenticates SePay with Authorization: Apikey header", async () => {
      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Apikey ${TEST_WEBHOOK_SECRET}`,
        },
        body: JSON.stringify({
          id: `SEPAY_DUAL_${Date.now()}`,
          transferAmount: 100000,
          content: `Chuyen khoan ${TEST_ORDER_CODE}`,
          gateway: "MBBank",
        }),
      });

      const res = await paymentWebhookPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("rejects SePay with invalid Apikey header", async () => {
      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Apikey wrong-secret-key",
        },
        body: JSON.stringify({
          id: `SEPAY_DUAL_FAIL_${Date.now()}`,
          transferAmount: 100000,
          content: `Chuyen khoan ${TEST_ORDER_CODE}`,
        }),
      });

      const res = await paymentWebhookPost(req);
      expect(res.status).toBe(401);
    });
  });

  describe("3. PayOS Signature Authentication", () => {
    it("authenticates PayOS body with valid HMAC-SHA256 signature without headers", async () => {
      const payosData = {
        orderCode: 998877,
        amount: 100000,
        description: `PAYOS TT ${TEST_ORDER_CODE}`,
        reference: `PAYOS_REF_${Date.now()}`,
      };

      // Generate valid PayOS signature
      const sortedKeys = Object.keys(payosData).sort();
      const signString = sortedKeys
        .map((k) => `${k}=${(payosData as any)[k]}`)
        .join("&");
      const validSignature = crypto.createHmac("sha256", TEST_WEBHOOK_SECRET).update(signString).digest("hex");

      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: "00",
          desc: "success",
          data: payosData,
          signature: validSignature,
        }),
      });

      const res = await paymentWebhookPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("rejects PayOS body when data is tampered with invalid signature", async () => {
      const payosData = {
        orderCode: 998877,
        amount: 100000,
        description: `PAYOS TT ${TEST_ORDER_CODE}`,
      };

      const req = new Request("http://localhost:3000/api/webhooks/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: "00",
          desc: "success",
          data: payosData,
          signature: "forged_or_invalid_signature_hex_value_0000000000000000000000000000",
        }),
      });

      const res = await paymentWebhookPost(req);
      expect(res.status).toBe(401);
    });
  });
});
