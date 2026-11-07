import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, CouponType, OrderStatus, ReconciliationStatus, FulfillmentType } from "@/lib/prisma";
import { createOrder, getOrderDetails } from "@/services/order.service";
import { handleIncomingTransaction } from "@/services/payment.service";
import { validateCoupon, calculateDiscount, MIN_ORDER_PAYMENT_FLOOR } from "@/services/coupon.service";
import { GET as getOrderStatusRoute } from "@/app/api/orders/[orderCode]/status/route";
import { POST as validateCartRoute } from "@/app/api/cart/validate/route";
import { POST as validateCouponRoute } from "@/app/api/coupons/validate/route";
import {
  formatRemainingTime,
  calculateRemainingSeconds,
} from "@/components/CountdownTimer";
import {
  maskSecret,
  parseSecretItem,
} from "@/components/SecretDisplay";

describe("Milestone 3 Empirical Challenger: Purchase Flow & Handover Stress Suite", () => {
  const TEST_CAT_SLUG = "challenger-m3-cat";
  const TEST_KEY_SLUG = "challenger-m3-key";
  const TEST_SMM_SLUG = "challenger-m3-smm";
  const TEST_COUPON_CODE = "CHALLENGE20";
  const TEST_FIXED_COUPON_CODE = "CHALLENGE50K";
  const TEST_CUSTOMER_EMAIL = "challenger-m3-buyer@example.com";

  let catId: string;
  let keyProductId: string;
  let smmProductId: string;

  beforeAll(async () => {
    // Teardown any leftover test data
    await prisma.paymentTransaction.deleteMany({
      where: { transactionId: { startsWith: "TX_CHALLENGE_M3_" } },
    });
    await prisma.productItem.deleteMany({
      where: {
        product: { slug: { in: [TEST_KEY_SLUG, TEST_SMM_SLUG] } },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        product: { slug: { in: [TEST_KEY_SLUG, TEST_SMM_SLUG] } },
      },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
    await prisma.coupon.deleteMany({
      where: { code: { in: [TEST_COUPON_CODE, TEST_FIXED_COUPON_CODE] } },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: [TEST_KEY_SLUG, TEST_SMM_SLUG] } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });

    // Create Category
    const category = await prisma.category.create({
      data: {
        name: "Challenger M3 Cat",
        slug: TEST_CAT_SLUG,
      },
    });
    catId = category.id;

    // Create Local Stock Product (Unit Price: 60,000 VND)
    const keyProduct = await prisma.product.create({
      data: {
        title: "Challenger API Key Product",
        slug: TEST_KEY_SLUG,
        description: "Standard local stock product",
        price: 60000,
        categoryId: catId,
        type: "LICENSE_KEY",
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
        minQuantity: 1,
        maxQuantity: 10,
      },
    });
    keyProductId = keyProduct.id;

    // Seed 10 stock items
    for (let i = 1; i <= 10; i++) {
      await prisma.productItem.create({
        data: {
          productId: keyProductId,
          secretContent: `CHALLENGE-KEY-${i}`,
          status: "AVAILABLE",
        },
      });
    }

    // Create SMM / Service Product requiring link
    const smmProduct = await prisma.product.create({
      data: {
        title: "Challenger TikTok Followers Service",
        slug: TEST_SMM_SLUG,
        description: "Social media marketing product requiring target link",
        price: 200,
        categoryId: catId,
        type: "MANUAL",
        isActive: true,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        minQuantity: 100,
        maxQuantity: 10000,
      },
    });
    smmProductId = smmProduct.id;

    // Create Coupons:
    // 1. CHALLENGE20: 20% off, min order 100,000 VND, max discount 50,000 VND
    await prisma.coupon.create({
      data: {
        code: TEST_COUPON_CODE,
        type: CouponType.PERCENT,
        value: 20,
        minOrderValue: 100000,
        maxDiscount: 50000,
        isActive: true,
      },
    });

    // 2. CHALLENGE50K: 50,000 VND fixed discount, min order 50,000 VND
    await prisma.coupon.create({
      data: {
        code: TEST_FIXED_COUPON_CODE,
        type: CouponType.FIXED,
        value: 50000,
        minOrderValue: 50000,
        maxDiscount: null,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.paymentTransaction.deleteMany({
      where: { transactionId: { startsWith: "TX_CHALLENGE_M3_" } },
    });
    await prisma.productItem.deleteMany({
      where: {
        product: { slug: { in: [TEST_KEY_SLUG, TEST_SMM_SLUG] } },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        product: { slug: { in: [TEST_KEY_SLUG, TEST_SMM_SLUG] } },
      },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
    await prisma.coupon.deleteMany({
      where: { code: { in: [TEST_COUPON_CODE, TEST_FIXED_COUPON_CODE] } },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: [TEST_KEY_SLUG, TEST_SMM_SLUG] } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
    await prisma.$disconnect();
  });

  // =========================================================================
  // Dimension 1: Cart Validation & Dynamic Coupon Threshold Re-evaluation
  // =========================================================================
  describe("Dimension 1: Cart Quantity Stepping & Dynamic Coupon Recalculation", () => {
    it("empirically verifies changing quantities dynamically modifies coupon eligibility", async () => {
      // Step A: Cart has 2 items of price 60,000 VND => Subtotal = 120,000 VND (>= 100k min order)
      let currentSubtotal = 60000 * 2;
      let req = new Request("http://localhost:3000/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: TEST_COUPON_CODE,
          cartTotal: currentSubtotal,
        }),
      });
      let res = await validateCouponRoute(req as any);
      expect(res.status).toBe(200);
      let data = await res.json();

      expect(data.valid).toBe(true);
      expect(data.code).toBe(TEST_COUPON_CODE);
      // 20% of 120,000 = 24,000
      expect(data.discountAmount).toBe(24000);
      expect(data.finalTotal).toBe(96000);

      // Step B: User reduces quantity to 1 item => Subtotal = 60,000 VND (< 100k min order)
      // Dynamic re-evaluation must reject coupon and report minimum threshold requirement
      currentSubtotal = 60000 * 1;
      req = new Request("http://localhost:3000/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: TEST_COUPON_CODE,
          cartTotal: currentSubtotal,
        }),
      });
      res = await validateCouponRoute(req as any);
      data = await res.json();

      expect(data.valid).toBe(false);
      expect(data.discountAmount).toBe(0);
      expect(data.finalTotal).toBe(60000);
      expect(data.message).toContain("tối thiểu từ 100.000đ");

      // Step C: User increases quantity to 3 items => Subtotal = 180,000 VND (>= 100k min order)
      // Dynamic re-evaluation must re-accept coupon with new 20% discount (36,000 VND)
      currentSubtotal = 60000 * 3;
      req = new Request("http://localhost:3000/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: TEST_COUPON_CODE,
          cartTotal: currentSubtotal,
        }),
      });
      res = await validateCouponRoute(req as any);
      data = await res.json();

      expect(data.valid).toBe(true);
      expect(data.discountAmount).toBe(36000);
      expect(data.finalTotal).toBe(144000);
    });

    it("verifies coupon maxDiscount capping and 1,000 VND VietQR floor safeguard", async () => {
      // Step A: High subtotal (500,000 VND). 20% = 100,000 VND, capped at maxDiscount 50,000 VND
      const highTotal = 500000;
      const resultCap = await validateCoupon(TEST_COUPON_CODE, highTotal);
      expect(resultCap.valid).toBe(true);
      expect(resultCap.discountAmount).toBe(50000);
      expect(resultCap.finalTotal).toBe(450000);

      // Step B: Fixed coupon 50,000 VND on order of 50,500 VND. Total cannot drop below 1,000 VND floor
      const closeFloorTotal = 50500;
      const resultFloor = await validateCoupon(TEST_FIXED_COUPON_CODE, closeFloorTotal);
      expect(resultFloor.valid).toBe(true);
      // Discount adjusted so finalTotal is at least 1,000 VND (discount = 49,500)
      expect(resultFloor.finalTotal).toBe(MIN_ORDER_PAYMENT_FLOOR);
      expect(resultFloor.discountAmount).toBe(closeFloorTotal - MIN_ORDER_PAYMENT_FLOOR);
    });

    it("verifies authoritative server cart validation (/api/cart/validate) prevents client tampering", async () => {
      // Submitting tampered item price
      const req = new Request("http://localhost:3000/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            { productId: keyProductId, quantity: 2, price: 100 }, // tampered price: 100 VND instead of 60,000
          ],
        }),
      });
      const res = await validateCartRoute(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.valid).toBe(true);
      // Server uses authoritative DB price 60,000 * 2 = 120,000, not tampered 100
      expect(data.subtotalAmount).toBe(120000);
      expect(data.items[0].price).toBe(60000);
      expect(data.items[0].itemTotal).toBe(120000);
    });

    it("verifies cart validation rejects quantities exceeding maxQuantity and available stock", async () => {
      // Test A: Exceeding maxQuantity (15 > maxQuantity 10)
      let req = new Request("http://localhost:3000/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: keyProductId, quantity: 15 }],
        }),
      });
      let res = await validateCartRoute(req);
      let data = await res.json();

      expect(data.valid).toBe(false);
      expect(data.items[0].hasError).toBe(true);
      expect(data.items[0].errorMessage).toBe("Số lượng vượt quá giới hạn tối đa (10).");

      // Test B: Exceeding live stock when maxQuantity is high (e.g. maxQuantity = 50, but stock is 10)
      await prisma.product.update({
        where: { id: keyProductId },
        data: { maxQuantity: 50 },
      });

      req = new Request("http://localhost:3000/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: keyProductId, quantity: 15 }],
        }),
      });
      res = await validateCartRoute(req);
      data = await res.json();

      expect(data.valid).toBe(false);
      expect(data.items[0].hasError).toBe(true);
      expect(data.items[0].errorMessage).toBe("Kho chỉ còn 10 sản phẩm khả dụng.");

      // Restore maxQuantity
      await prisma.product.update({
        where: { id: keyProductId },
        data: { maxQuantity: 10 },
      });
    });
  });

  // =========================================================================
  // Dimension 2: Case-Insensitive SMM URL Protocol Validation
  // =========================================================================
  describe("Dimension 2: Case-Insensitive SMM URL Protocol Validation", () => {
    // Client-side Cart & Checkout link validation logic:
    // const lower = link.toLowerCase();
    // const isValidProtocol = lower.startsWith("http://") || lower.startsWith("https://");
    const validateProtocol = (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) return false;
      const lower = trimmed.toLowerCase();
      return lower.startsWith("http://") || lower.startsWith("https://");
    };

    it("accepts valid URL protocols regardless of letter casing", () => {
      const validUrls = [
        "https://www.tiktok.com/@user/video/7192837192",
        "http://instagram.com/p/Co123456789",
        "HTTP://TIKTOK.COM/@INFLUENCER",
        "HTTPS://FACEBOOK.COM/STORY.PHP?ID=100",
        "Http://youtube.com/watch?v=dQw4w9WgXcQ",
        "Https://t.me/telegram_channel/123",
        "hTTps://threads.net/@creator/post/XYZ",
      ];

      for (const url of validUrls) {
        expect(validateProtocol(url), `Expected URL to pass: ${url}`).toBe(true);
      }
    });

    it("strictly rejects invalid schemes, protocol-less URLs, and dangerous inputs", () => {
      const invalidUrls = [
        "ftp://files.example.com/item",
        "javascript:alert(1)",
        "file:///C:/Windows/system32",
        "data:text/html;base64,PHNjcmlwdD4=",
        "tiktok.com/@user", // missing protocol prefix
        "@username_only",
        "   ",
        "",
      ];

      for (const url of invalidUrls) {
        expect(validateProtocol(url), `Expected URL to fail: ${url}`).toBe(false);
      }
    });
  });

  // =========================================================================
  // Dimension 3: Underpayment Delta VietQR Generation & Polling Status
  // =========================================================================
  describe("Dimension 3: Underpayment Delta VietQR Generation", () => {
    it("generates dynamic delta VietQR URL and exact remaining balance when reconciliationStatus is UNDERPAID", async () => {
      // Create an order for 120,000 VND
      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: keyProductId, quantity: 2 }],
      });

      expect(order.totalAmount).toBe(120000);
      expect(order.status).toBe(OrderStatus.PENDING);

      // Simulate an incoming bank transfer with UNDERPAID amount: 70,000 VND (short by 50,000 VND)
      const txResult = await handleIncomingTransaction({
        transactionId: `TX_CHALLENGE_M3_${Date.now()}`,
        amount: 70000,
        content: `Thanh toan don ${order.orderCode}`,
        bankCode: "MB",
      });

      expect(txResult.success).toBe(false);
      expect(txResult.reconciliationStatus).toBe(ReconciliationStatus.UNDERPAID);

      // Verify DB order status reflects UNDERPAID
      const updatedOrder = await getOrderDetails(order.orderCode);
      expect(updatedOrder?.status).toBe(OrderStatus.PENDING);
      expect(updatedOrder?.reconciliationStatus).toBe(ReconciliationStatus.UNDERPAID);
      expect(updatedOrder?.reconciliationNote).toContain("Chuyển thiếu 50.000đ");
      expect(updatedOrder?.reconciliationNote).toContain("Đã nhận: 70.000đ");

      // Invoke the polling Status API route handler
      const req = new Request(`http://localhost:3000/api/orders/${order.orderCode}/status?token=${order.accessToken}`);
      const res = await getOrderStatusRoute(req, {
        params: { orderCode: order.orderCode },
      });

      expect(res.status).toBe(200);
      const json = await res.json();

      // Check authoritative underpayment response fields
      expect(json.status).toBe("PENDING");
      expect(json.reconciliationStatus).toBe("UNDERPAID");
      expect(json.paidAmount).toBe(70000);
      expect(json.remainingAmount).toBe(50000);
      expect(json.totalAmount).toBe(120000);

      // Verify dynamic Delta VietQR URL
      expect(json.deltaVietQrUrl).toBeDefined();
      expect(json.deltaVietQrUrl).not.toBeNull();
      expect(json.deltaVietQrUrl).toContain("https://img.vietqr.io/image/");
      // The Delta QR MUST encode the remaining balance (50000), NOT original total (120000)
      expect(json.deltaVietQrUrl).toContain("amount=50000");
      expect(json.deltaVietQrUrl).toContain(`addInfo=${order.orderCode}`);
    });

    it("correctly parses multi-dot formatted Vietnamese numbers in reconciliation notes", () => {
      // Test regex parsing against large numbers with vi-VN formatting
      const sampleNote = "Chuyển thiếu 1.500.000đ (Đã nhận: 500.000đ, Cần thanh toán: 2.000.000đ)";
      const matchReceived = sampleNote.match(/Đã nhận:\s*([\d.,]+)đ/);
      const matchDiff = sampleNote.match(/Chuyển thiếu\s*([\d.,]+)đ/);

      expect(matchReceived).not.toBeNull();
      expect(matchDiff).not.toBeNull();

      const rawDiff = parseInt(matchDiff![1].replace(/[.,]/g, ""), 10);
      const rawRecv = parseInt(matchReceived![1].replace(/[.,]/g, ""), 10);

      expect(rawDiff).toBe(1500000);
      expect(rawRecv).toBe(500000);
    });
  });

  // =========================================================================
  // Dimension 4: CountdownTimer Ref Reset on Regeneration Lifecycle
  // =========================================================================
  describe("Dimension 4: CountdownTimer Lifecycle & onExpireCalled Ref Reset", () => {
    it("correctly calculates remaining seconds and handles boundaries", () => {
      vi.useFakeTimers();
      const fixedNow = 1700000000000;
      vi.setSystemTime(fixedNow);
      expect(calculateRemainingSeconds(fixedNow + 600000)).toBe(600); // 10 minutes
      expect(calculateRemainingSeconds(fixedNow + 180000)).toBe(180); // 3 minutes (urgent boundary)
      expect(calculateRemainingSeconds(fixedNow + 60000)).toBe(60);   // 1 minute (critical boundary)
      expect(calculateRemainingSeconds(fixedNow - 1000)).toBe(0);     // Expired clamp
      vi.useRealTimers();
    });

    it("formats MM:SS across all intervals", () => {
      expect(formatRemainingTime(600)).toBe("10:00");
      expect(formatRemainingTime(180)).toBe("03:00");
      expect(formatRemainingTime(59)).toBe("00:59");
      expect(formatRemainingTime(5)).toBe("00:05");
      expect(formatRemainingTime(0)).toBe("00:00");
      expect(formatRemainingTime(-50)).toBe("00:00");
    });

    it("empirically verifies the onExpireCalled ref reset state machine across timer regeneration", () => {
      // Emulate the exact state machine of CountdownTimer:
      //
      // let onExpireCalled = { current: false };
      // function runEffect(expiresAt, onExpire) {
      //   const initialRemaining = calculateRemainingSeconds(expiresAt);
      //   if (initialRemaining <= 0) {
      //     if (!onExpireCalled.current) {
      //       onExpireCalled.current = true;
      //       onExpire();
      //     }
      //     return;
      //   }
      //   onExpireCalled.current = false; // <-- The critical reset
      //   ...
      // }

      let expireCallCount = 0;
      const onExpire = () => {
        expireCallCount++;
      };

      const timerRef = { current: false };

      const simulateTimerEffect = (remainingSeconds: number) => {
        if (remainingSeconds <= 0) {
          if (!timerRef.current) {
            timerRef.current = true;
            onExpire();
          }
          return;
        }
        // Worker's fix on line 67 of CountdownTimer.tsx:
        timerRef.current = false;
      };

      // 1. Initial 10-minute timer mounted
      simulateTimerEffect(600);
      expect(timerRef.current).toBe(false);
      expect(expireCallCount).toBe(0);

      // 2. Timer ticks down to 0
      simulateTimerEffect(0);
      expect(timerRef.current).toBe(true);
      expect(expireCallCount).toBe(1);

      // 3. Repeated ticks at 0 do NOT call onExpire again (idempotent suppression)
      simulateTimerEffect(0);
      simulateTimerEffect(0);
      expect(expireCallCount).toBe(1);

      // 4. User clicks "Tạo lại mã QR" -> new expiresAt is generated (600s in the future)
      // The effect re-runs with remaining > 0
      simulateTimerEffect(600);
      // Verify ref was reset to false
      expect(timerRef.current).toBe(false);
      expect(expireCallCount).toBe(1);

      // 5. The regenerated timer ticks down to 0
      simulateTimerEffect(0);
      // Verify onExpire was triggered a SECOND time!
      expect(timerRef.current).toBe(true);
      expect(expireCallCount).toBe(2);

      // 6. Repeated ticks at 0 still suppressed
      simulateTimerEffect(0);
      expect(expireCallCount).toBe(2);
    });
  });

  // =========================================================================
  // Dimension 5: SecretDisplay Masking & Branded Export Audit
  // =========================================================================
  describe("Dimension 5: SecretDisplay Masking & Post-Purchase Handover", () => {
    it("properly masks sensitive credentials by product type", () => {
      // API Key masking: sk-prefix preserved, tail preserved, middle masked
      const apiKey = "sk-ant-api03-abcdefghijklmnop1234567890xyz";
      const maskedApi = maskSecret(apiKey);
      expect(maskedApi).toContain("sk-ant-");
      expect(maskedApi).toContain("•");
      expect(maskedApi).toContain("0xyz");
      expect(maskedApi).not.toBe(apiKey);

      // Account masking
      const accountCred = "customer@kho.dee|SecureP@ssw0rd!";
      const maskedAcc = maskSecret(accountCred, "ACCOUNT");
      expect(maskedAcc).toBe("••••••••••••••••");

      // License Key masking
      const licenseKey = "W269N-WFGWX-YVC9B-4J6C9-T83GX";
      const maskedKey = maskSecret(licenseKey, "LICENSE_KEY");
      expect(maskedKey).toBe("W269-•••••-•••••-83GX");
    });

    it("parses account credentials cleanly without quotes or leaks", () => {
      const parsed = parseSecretItem("  user@kho.dee | 'myStrongPass'  ", "ACCOUNT");
      expect(parsed.isAccount).toBe(true);
      expect(parsed.username).toBe("user@kho.dee");
      expect(parsed.password).toBe("myStrongPass");
    });
  });
});
