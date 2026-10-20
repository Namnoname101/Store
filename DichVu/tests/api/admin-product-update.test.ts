import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, ProductType } from "@/lib/prisma";
import { PUT as updateProduct } from "@/app/api/admin/products/[id]/route";
import { NextRequest } from "next/server";

describe("Admin Product Update API - Google Drive Thumbnail Normalization", () => {
  const TEST_CAT_SLUG = "test-cat-admin-update";
  const TEST_PROD_SLUG = "test-prod-admin-update";
  let testCategoryId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Cleanup residual
    await prisma.product.deleteMany({ where: { slug: TEST_PROD_SLUG } });
    await prisma.category.deleteMany({ where: { slug: TEST_CAT_SLUG } });

    const cat = await prisma.category.create({
      data: {
        name: "Test Update Category",
        slug: TEST_CAT_SLUG,
      },
    });
    testCategoryId = cat.id;

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
});
