import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, ItemStatus, OrderStatus, FulfillmentType } from "@/lib/prisma";
import { POST as validateCartRoute } from "@/app/api/cart/validate/route";
import { POST as createOrderRoute } from "@/app/api/orders/route";
import { createOrder, getOrderDetails } from "@/services/order.service";

describe("Phase 3A: Cart & Guest Checkout Full Test Suite", () => {
  const TEST_CAT_SLUG = "phase3a-test-cat";
  const PROD_IN_STOCK_SLUG = "phase3a-prod-in-stock";
  const PROD_LIMITED_SLUG = "phase3a-prod-limited";
  const PROD_INACTIVE_SLUG = "phase3a-prod-inactive";
  const PROD_SMM_SLUG = "phase3a-prod-smm";

  let catId: string;
  let inStockProdId: string;
  let limitedProdId: string;
  let inactiveProdId: string;
  let smmProdId: string;

  beforeAll(async () => {
    // Cleanup residual data
    const slugs = [
      PROD_IN_STOCK_SLUG,
      PROD_LIMITED_SLUG,
      PROD_INACTIVE_SLUG,
      PROD_SMM_SLUG,
    ];

    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: slugs } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });

    // Create Category
    const category = await prisma.category.create({
      data: {
        name: "Phase 3A Test Category",
        slug: TEST_CAT_SLUG,
      },
    });
    catId = category.id;

    // 1. In-stock Product: price = 50,000 VND, 5 items available
    const inStockProd = await prisma.product.create({
      data: {
        title: "Phase 3A In-Stock Key",
        slug: PROD_IN_STOCK_SLUG,
        description: "Test description for in-stock",
        price: 50000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
        minQuantity: 1,
        maxQuantity: 10,
      },
    });
    inStockProdId = inStockProd.id;

    for (let i = 1; i <= 5; i++) {
      await prisma.productItem.create({
        data: {
          productId: inStockProdId,
          secretContent: `KEY-INSTOCK-00${i}`,
          status: ItemStatus.AVAILABLE,
        },
      });
    }

    // 2. Limited Product: price = 100,000 VND, only 1 item available
    const limitedProd = await prisma.product.create({
      data: {
        title: "Phase 3A Limited Product",
        slug: PROD_LIMITED_SLUG,
        description: "Test description for limited",
        price: 100000,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
        minQuantity: 1,
        maxQuantity: 5,
      },
    });
    limitedProdId = limitedProd.id;

    await prisma.productItem.create({
      data: {
        productId: limitedProdId,
        secretContent: "KEY-LIMITED-ONLY-ONE",
        status: ItemStatus.AVAILABLE,
      },
    });

    // 3. Inactive Product: price = 30,000 VND
    const inactiveProd = await prisma.product.create({
      data: {
        title: "Phase 3A Inactive Product",
        slug: PROD_INACTIVE_SLUG,
        description: "Test description for inactive",
        price: 30000,
        categoryId: catId,
        isActive: false,
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });
    inactiveProdId = inactiveProd.id;

    // 4. SMM Product: price = 250 VND, minQuantity = 50, maxQuantity = 5000
    const smmProd = await prisma.product.create({
      data: {
        title: "Phase 3A TikTok Follow Dịch Vụ",
        slug: PROD_SMM_SLUG,
        description: "Test description for smm",
        price: 250,
        categoryId: catId,
        isActive: true,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        minQuantity: 50,
        maxQuantity: 5000,
      },
    });
    smmProdId = smmProd.id;
  });

  afterAll(async () => {
    const slugs = [
      PROD_IN_STOCK_SLUG,
      PROD_LIMITED_SLUG,
      PROD_INACTIVE_SLUG,
      PROD_SMM_SLUG,
    ];
    await prisma.productItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: { in: slugs } } },
    });
    await prisma.order.deleteMany({
      where: {
        orderItems: {
          some: { product: { slug: { in: slugs } } },
        },
      },
    });
    await prisma.product.deleteMany({
      where: { slug: { in: slugs } },
    });
    await prisma.category.deleteMany({
      where: { slug: TEST_CAT_SLUG },
    });
  });

  describe("1. Server Cart Validation API (POST /api/cart/validate)", () => {
    it("should reject an empty cart request", async () => {
      const req = new Request("http://localhost/api/cart/validate", {
        method: "POST",
        body: JSON.stringify({ items: [] }),
      });
      const res = await validateCartRoute(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.valid).toBe(false);
      expect(json.error).toContain("Giỏ hàng không có sản phẩm");
    });

    it("should validate and return authoritative database prices and sum subtotal", async () => {
      const req = new Request("http://localhost/api/cart/validate", {
        method: "POST",
        body: JSON.stringify({
          items: [
            { productId: inStockProdId, quantity: 2 }, // 50,000 * 2 = 100,000
            { productId: limitedProdId, quantity: 1 }, // 100,000 * 1 = 100,000
          ],
        }),
      });
      const res = await validateCartRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.valid).toBe(true);
      expect(json.subtotalAmount).toBe(200000);
      expect(json.items).toHaveLength(2);
      expect(json.items[0].price).toBe(50000);
      expect(json.items[1].price).toBe(100000);
    });

    it("should detect when product is inactive and return valid: false", async () => {
      const req = new Request("http://localhost/api/cart/validate", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: inactiveProdId, quantity: 1 }],
        }),
      });
      const res = await validateCartRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.valid).toBe(false);
      expect(json.items[0].hasError).toBe(true);
      expect(json.items[0].errorMessage).toContain("tạm dừng bán");
    });

    it("should detect when requested quantity exceeds available stock", async () => {
      // limitedProd only has 1 item in stock
      const req = new Request("http://localhost/api/cart/validate", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: limitedProdId, quantity: 3 }],
        }),
      });
      const res = await validateCartRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.valid).toBe(false);
      expect(json.items[0].hasError).toBe(true);
      expect(json.items[0].errorMessage).toContain("Kho chỉ còn 1");
    });

    it("should validate SMM min quantity bounds correctly", async () => {
      // smmProd has minQuantity = 50
      const req = new Request("http://localhost/api/cart/validate", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: smmProdId, quantity: 10 }],
        }),
      });
      const res = await validateCartRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.valid).toBe(false);
      expect(json.items[0].hasError).toBe(true);
      expect(json.items[0].errorMessage).toContain("Số lượng tối thiểu là 50");
    });
  });

  describe("2. Guest Checkout (Creating orders without email)", () => {
    it("should successfully create an order with null customerEmail", async () => {
      const order = await createOrder({
        customerEmail: null,
        items: [{ productId: inStockProdId, quantity: 1 }],
        customerNote: "Khách vãng lai không dùng email",
      });

      expect(order).toBeDefined();
      expect(order.orderCode).toMatch(/^ORD[A-Z0-9]{6}$/);
      expect(order.customerEmail).toBeNull();
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.totalAmount).toBe(50000);
      expect(order.customerNote).toBe("Khách vãng lai không dùng email");

      // Verify DB retrieval
      const found = await getOrderDetails(order.orderCode);
      expect(found).not.toBeNull();
      expect(found?.customerEmail).toBeNull();
      expect(found?.orderItems).toHaveLength(1);
    });

    it("should successfully create an order through POST /api/orders without email", async () => {
      const req = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: inStockProdId, quantity: 1 }],
          customerEmail: "", // Empty string sanitized to null
          customerNote: "Test API route guest checkout",
        }),
      });
      const res = await createOrderRoute(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.order.orderCode).toBeDefined();

      const created = await prisma.order.findUnique({
        where: { orderCode: json.order.orderCode },
      });
      expect(created?.customerEmail).toBeNull();
    });

    it("should reject order if invalid email format is provided", async () => {
      const req = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: inStockProdId, quantity: 1 }],
          customerEmail: "not-a-valid-email",
        }),
      });
      const res = await createOrderRoute(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain("Invalid customer email address");
    });
  });

  describe("3. Multi-Item Cart Checkout & Stock Reservation", () => {
    it("should create order containing multiple distinct items and reserve their stock", async () => {
      const order = await createOrder({
        customerEmail: "multi@example.com",
        items: [
          { productId: inStockProdId, quantity: 1 },
          { productId: smmProdId, quantity: 100 }, // SMM 100 * 250 = 25,000
        ],
        customerNote: "Đơn hàng đa sản phẩm",
      });

      expect(order.orderItems).toHaveLength(2);
      // Total: 50,000 (prod1) + 25,000 (smm) = 75,000 VND
      expect(order.totalAmount).toBe(75000);

      // Verify that reserved stock for inStockProd is marked RESERVED
      const reservedItems = await prisma.productItem.findMany({
        where: {
          productId: inStockProdId,
          orderId: order.id,
          status: ItemStatus.RESERVED,
        },
      });
      expect(reservedItems).toHaveLength(1);
    });
  });
});
