import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma, ItemStatus, OrderStatus } from "@/lib/prisma";
import { createOrder, getOrderDetails, checkAndExpireOrder } from "@/services/order.service";
import { handleIncomingTransaction } from "@/services/payment.service";
import { GET as getOrderStatusRoute } from "@/app/api/orders/[orderCode]/status/route";
import {
  formatRemainingTime,
  calculateRemainingSeconds,
} from "@/components/CountdownTimer";
import {
  getProductInstructions,
  parseSecretItem,
} from "@/components/SecretDisplay";

describe("Checkout & Auto-Delivery Flow", () => {
  const TEST_CATEGORY_SLUG = "test-ui-cat";
  const TEST_PRODUCT_KEY_SLUG = "test-ui-key";
  const TEST_PRODUCT_ACC_SLUG = "test-ui-acc";
  const TEST_PRODUCT_COURSE_SLUG = "test-ui-course";
  const TEST_CUSTOMER_EMAIL = "buyer-checkout@example.com";

  let testCategoryId: string;
  let testKeyProductId: string;
  let testAccProductId: string;
  let testCourseProductId: string;

  beforeAll(async () => {
    // Teardown previous test data if any
    await prisma.paymentTransaction.deleteMany({
      where: { transactionId: { startsWith: "TX_UI_" } },
    });
    await prisma.productItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [
              TEST_PRODUCT_KEY_SLUG,
              TEST_PRODUCT_ACC_SLUG,
              TEST_PRODUCT_COURSE_SLUG,
            ],
          },
        },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [
              TEST_PRODUCT_KEY_SLUG,
              TEST_PRODUCT_ACC_SLUG,
              TEST_PRODUCT_COURSE_SLUG,
            ],
          },
        },
      },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
    await prisma.product.deleteMany({
      where: {
        slug: {
          in: [
            TEST_PRODUCT_KEY_SLUG,
            TEST_PRODUCT_ACC_SLUG,
            TEST_PRODUCT_COURSE_SLUG,
          ],
        },
      },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    });

    // Create Category
    const category = await prisma.category.create({
      data: {
        name: "Test UI Category",
        slug: TEST_CATEGORY_SLUG,
      },
    });
    testCategoryId = category.id;

    // Create Products: Key, Account, Course
    const prodKey = await prisma.product.create({
      data: {
        title: "Windows 11 Pro Retail Key",
        slug: TEST_PRODUCT_KEY_SLUG,
        description: "Genuine license key",
        price: 150000,
        categoryId: testCategoryId,
        type: "LICENSE_KEY",
        isActive: true,
      },
    });
    testKeyProductId = prodKey.id;

    const prodAcc = await prisma.product.create({
      data: {
        title: "ChatGPT Plus 1 Month",
        slug: TEST_PRODUCT_ACC_SLUG,
        description: "Shared OpenAI account",
        price: 99000,
        categoryId: testCategoryId,
        type: "ACCOUNT",
        isActive: true,
      },
    });
    testAccProductId = prodAcc.id;

    const prodCourse = await prisma.product.create({
      data: {
        title: "Fullstack Next.js Masterclass",
        slug: TEST_PRODUCT_COURSE_SLUG,
        description: "Complete course access",
        price: 299000,
        categoryId: testCategoryId,
        type: "COURSE_LINK",
        isActive: true,
      },
    });
    testCourseProductId = prodCourse.id;
  });

  afterAll(async () => {
    await prisma.paymentTransaction.deleteMany({
      where: { transactionId: { startsWith: "TX_UI_" } },
    });
    await prisma.productItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [
              TEST_PRODUCT_KEY_SLUG,
              TEST_PRODUCT_ACC_SLUG,
              TEST_PRODUCT_COURSE_SLUG,
            ],
          },
        },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        product: {
          slug: {
            in: [
              TEST_PRODUCT_KEY_SLUG,
              TEST_PRODUCT_ACC_SLUG,
              TEST_PRODUCT_COURSE_SLUG,
            ],
          },
        },
      },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
    await prisma.product.deleteMany({
      where: {
        slug: {
          in: [
            TEST_PRODUCT_KEY_SLUG,
            TEST_PRODUCT_ACC_SLUG,
            TEST_PRODUCT_COURSE_SLUG,
          ],
        },
      },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CATEGORY_SLUG },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.paymentTransaction.deleteMany({
      where: { transactionId: { startsWith: "TX_UI_" } },
    });
    await prisma.productItem.deleteMany({
      where: {
        productId: {
          in: [testKeyProductId, testAccProductId, testCourseProductId],
        },
      },
    });
    await prisma.orderItem.deleteMany({
      where: {
        productId: {
          in: [testKeyProductId, testAccProductId, testCourseProductId],
        },
      },
    });
    await prisma.order.deleteMany({
      where: { customerEmail: TEST_CUSTOMER_EMAIL },
    });
  });

  async function seedStock(productId: string, secrets: string[]) {
    return prisma.productItem.createMany({
      data: secrets.map((secret) => ({
        productId,
        secretContent: secret,
        status: ItemStatus.AVAILABLE,
      })),
    });
  }

  describe("CountdownTimer Helpers", () => {
    it("formats seconds into mm:ss accurately", () => {
      expect(formatRemainingTime(900)).toBe("15:00");
      expect(formatRemainingTime(65)).toBe("01:05");
      expect(formatRemainingTime(9)).toBe("00:09");
      expect(formatRemainingTime(0)).toBe("00:00");
      expect(formatRemainingTime(-15)).toBe("00:00");
    });

    it("calculates remaining seconds correctly against future and past timestamps", () => {
      const now = Date.now();
      const future = new Date(now + 60000);
      const remainingFuture = calculateRemainingSeconds(future);
      expect(remainingFuture).toBeGreaterThanOrEqual(58);
      expect(remainingFuture).toBeLessThanOrEqual(61);

      const past = new Date(now - 10000);
      expect(calculateRemainingSeconds(past)).toBe(0);
    });
  });

  describe("SecretDisplay Helpers", () => {
    it("provides specific instructions by product type", () => {
      const keyGuide = getProductInstructions("LICENSE_KEY");
      expect(keyGuide.title).toContain("Key");
      expect(keyGuide.steps.length).toBeGreaterThan(0);

      const accGuide = getProductInstructions("ACCOUNT");
      expect(accGuide.title).toContain("Tài khoản");
      expect(accGuide.note).toBeDefined();

      const courseGuide = getProductInstructions("COURSE_LINK");
      expect(courseGuide.title).toContain("Khóa học");

      const defaultGuide = getProductInstructions("OTHER");
      expect(defaultGuide.title).toBeDefined();
    });

    it("parses account credentials correctly from separator string", () => {
      const parsedAcc = parseSecretItem("user@domain.com|secretPass123", "ACCOUNT");
      expect(parsedAcc.isAccount).toBe(true);
      expect(parsedAcc.username).toBe("user@domain.com");
      expect(parsedAcc.password).toBe("secretPass123");

      const parsedKey = parseSecretItem("W269N-WFGWX-YVC9B-4J6C9-T83GX", "LICENSE_KEY");
      expect(parsedKey.isAccount).toBe(false);
      expect(parsedKey.raw).toBe("W269N-WFGWX-YVC9B-4J6C9-T83GX");
    });
  });

  describe("Checkout Order Data Format & VietQR", () => {
    it("generates correct VietQR checkout details and orderCode format", async () => {
      await seedStock(testKeyProductId, ["KEY-AAA-111"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testKeyProductId, quantity: 1 }],
      });

      expect(order.orderCode).toMatch(/^ORD\d{6}$/);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.totalAmount).toBe(150000);

      const details = await getOrderDetails(order.orderCode);
      expect(details).not.toBeNull();
      expect(details?.orderCode).toBe(order.orderCode);
      expect(details?.vietQrUrl).toContain("https://img.vietqr.io/image/");
      expect(details?.vietQrUrl).toContain("150000");
      expect(details?.vietQrUrl).toContain(order.orderCode);
      expect(details?.expiresInSeconds).toBeGreaterThan(0);
    });

    it("strictly protects secretContent while order is PENDING", async () => {
      await seedStock(testKeyProductId, ["SUPER-SECRET-LICENSE-KEY"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testKeyProductId, quantity: 1 }],
      });

      const pendingDetails = await getOrderDetails(order.orderCode);
      expect(pendingDetails?.status).toBe(OrderStatus.PENDING);
      // No delivered items or secrets returned while pending
      expect(pendingDetails?.deliveredItems).toEqual([]);
    });

    it("reveals secretContent when order becomes PAID", async () => {
      await seedStock(testKeyProductId, ["SECRET-KEY-FOR-PAID-ORDER"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testKeyProductId, quantity: 1 }],
      });

      // Simulate payment transaction
      await handleIncomingTransaction({
        transactionId: "TX_UI_PAID_001",
        amount: order.totalAmount,
        content: `Thanh toan don hang ${order.orderCode}`,
        bankCode: "MB",
      });

      const paidDetails = await getOrderDetails(order.orderCode);
      expect(paidDetails?.status).toBe(OrderStatus.PAID);
      expect(paidDetails?.paidAt).toBeDefined();
      expect(paidDetails?.deliveredItems.length).toBe(1);
      expect(paidDetails?.deliveredItems[0].secretContent).toBe("SECRET-KEY-FOR-PAID-ORDER");
      expect(paidDetails?.deliveredItems[0].status).toBe(ItemStatus.SOLD);
    });
  });

  describe("Order Expiration Handling", () => {
    it("marks order as EXPIRED and releases reserved stock when past expiresAt", async () => {
      await seedStock(testKeyProductId, ["KEY-WILL-EXPIRE"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testKeyProductId, quantity: 1 }],
      });

      // Manually set expiresAt to the past
      await prisma.order.update({
        where: { id: order.id },
        data: {
          expiresAt: new Date(Date.now() - 5000),
        },
      });

      // Check order details triggers checkAndExpireOrder
      const expiredDetails = await getOrderDetails(order.orderCode);
      expect(expiredDetails?.status).toBe(OrderStatus.EXPIRED);
      expect(expiredDetails?.deliveredItems).toEqual([]);

      // Stock should be released back to AVAILABLE
      const items = await prisma.productItem.findMany({
        where: { productId: testKeyProductId },
      });
      expect(items[0].status).toBe(ItemStatus.AVAILABLE);
      expect(items[0].orderId).toBeNull();
    });
  });

  describe("API Status Polling Route", () => {
    it("returns correct status payload for polling client", async () => {
      await seedStock(testKeyProductId, ["KEY-FOR-STATUS-CHECK"]);

      const order = await createOrder({
        customerEmail: TEST_CUSTOMER_EMAIL,
        items: [{ productId: testKeyProductId, quantity: 1 }],
      });

      const req = new Request(`http://localhost:3000/api/orders/${order.orderCode}/status`);
      const res = await getOrderStatusRoute(req, {
        params: { orderCode: order.orderCode },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe(OrderStatus.PENDING);
      expect(json.vietQrUrl).toBeDefined();
      expect(json.expiresAt).toBeDefined();
      expect(json.deliveredItems).toEqual([]);
    });

    it("returns 404 for invalid orderCode", async () => {
      const req = new Request("http://localhost:3000/api/orders/ORD999999/status");
      const res = await getOrderStatusRoute(req, {
        params: { orderCode: "ORD999999" },
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });
  });
});
