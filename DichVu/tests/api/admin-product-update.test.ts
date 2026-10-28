import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, ProductType, MarkupType, SupplierType } from "@/lib/prisma";
import { PUT as updateProduct } from "@/app/api/admin/products/[id]/route";
import { NextRequest } from "next/server";

describe("Admin Product Update API - Google Drive Thumbnail & Unified Pricing Mode", () => {
  const TEST_CAT_SLUG = "test-cat-admin-update";
  const TEST_PROD_SLUG = "test-prod-admin-update";
  const TEST_SUP_CODE = "TEST_SUP_UPDATE_API";
  let testCategoryId: string;
  let testProductId: string;
  let testSupplierId: string;

  beforeAll(async () => {
    // Cleanup residual
    await prisma.supplierProductMapping.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.supplier.deleteMany({ where: { code: TEST_SUP_CODE } });
    await prisma.product.deleteMany({ where: { slug: TEST_PROD_SLUG } });
    await prisma.category.deleteMany({ where: { slug: TEST_CAT_SLUG } });

    const cat = await prisma.category.create({
      data: {
        name: "Test Update Category",
        slug: TEST_CAT_SLUG,
      },
    });
    testCategoryId = cat.id;

    const sup = await prisma.supplier.create({
      data: {
        name: "Test Update Supplier",
        code: TEST_SUP_CODE,
        type: SupplierType.TAPHOAMMO,
        baseUrl: "https://api.taphoammo.net",
        apiKey: "test-key",
        isActive: true,
      },
    });
    testSupplierId = sup.id;

    const prod = await prisma.product.create({
      data: {
        title: "Test Update Product",
        slug: TEST_PROD_SLUG,
        description: "Initial description",
        price: 25000,
        type: ProductType.ACCOUNT,
        categoryId: testCategoryId,
      },
    });
    testProductId = prod.id;
  });

  afterAll(async () => {
    await prisma.supplierProductMapping.deleteMany({
      where: { product: { slug: TEST_PROD_SLUG } },
    });
    await prisma.supplier.deleteMany({ where: { code: TEST_SUP_CODE } });
    await prisma.product.deleteMany({ where: { slug: TEST_PROD_SLUG } });
    await prisma.category.deleteMany({ where: { slug: TEST_CAT_SLUG } });
  });

  it("normalizes Google Drive share link into permanent Google CDN URL upon update", async () => {
    const rawDriveUrl = "https://drive.google.com/file/d/1jIb_AOrf8QeDg_Ai4d7ifFQpUclYbVvV/view";
    const expectedCdnUrl = "https://lh3.googleusercontent.com/d/1jIb_AOrf8QeDg_Ai4d7ifFQpUclYbVvV";

    const req = new NextRequest(`http://localhost:3000/api/admin/products/${testProductId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thumbnailUrl: rawDriveUrl,
      }),
    });

    const res = await updateProduct(req, { params: { id: testProductId } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.product.thumbnailUrl).toBe(expectedCdnUrl);

    // Verify persisted in database
    const inDb = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(inDb?.thumbnailUrl).toBe(expectedCdnUrl);
  });

  it("automatically disables isAutoSync (Price Lock Guard) when admin manually updates price", async () => {
    // Create mapping with isAutoSync = true
    await prisma.supplierProductMapping.upsert({
      where: { productId: testProductId },
      create: {
        productId: testProductId,
        supplierId: testSupplierId,
        supplierProductCode: "EXT_CODE_1",
        supplierPrice: 15000,
        markupType: MarkupType.PERCENTAGE,
        markupValue: 30,
        isAutoSync: true,
      },
      update: {
        isAutoSync: true,
      },
    });

    // Admin updates price to 59999 without specifying isAutoSync
    const req = new NextRequest(`http://localhost:3000/api/admin/products/${testProductId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price: 59999,
      }),
    });

    const res = await updateProduct(req, { params: { id: testProductId } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.product.price).toBe(59999);

    // Verify isAutoSync is now FALSE in mapping
    const mapping = await prisma.supplierProductMapping.findUnique({
      where: { productId: testProductId },
    });
    expect(mapping?.isAutoSync).toBe(false);
  });

  it("dynamically recalculates price when switching to auto-sync with markup", async () => {
    // Admin switches to isAutoSync: true with markup 50% on supplierPrice 15000
    // 15000 * 1.5 = 22500 -> rounded to nearest 1000 = 23000
    const req = new NextRequest(`http://localhost:3000/api/admin/products/${testProductId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isAutoSync: true,
        markupType: "PERCENTAGE",
        markupValue: 50,
      }),
    });

    const res = await updateProduct(req, { params: { id: testProductId } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.product.price).toBe(23000);

    const mapping = await prisma.supplierProductMapping.findUnique({
      where: { productId: testProductId },
    });
    expect(mapping?.isAutoSync).toBe(true);
    expect(mapping?.markupValue).toBe(50);
  });
});
