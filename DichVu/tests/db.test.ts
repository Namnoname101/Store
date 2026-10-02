import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";

describe("Database Schema & Prisma Client Tests", () => {
  beforeAll(async () => {
    // Clean up any previous test artifacts
    await prisma.productItem.deleteMany({
      where: { product: { slug: "test-chatgpt-plus" } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: "test-chatgpt-plus" } },
    });
    await prisma.product.deleteMany({
      where: { slug: "test-chatgpt-plus" },
    });
    await prisma.category.deleteMany({
      where: { slug: "test-ai-accounts" },
    });
  });

  afterAll(async () => {
    // Cleanup after test
    await prisma.productItem.deleteMany({
      where: { product: { slug: "test-chatgpt-plus" } },
    });
    await prisma.orderItem.deleteMany({
      where: { product: { slug: "test-chatgpt-plus" } },
    });
    await prisma.product.deleteMany({
      where: { slug: "test-chatgpt-plus" },
    });
    await prisma.category.deleteMany({
      where: { slug: "test-ai-accounts" },
    });
    await prisma.$disconnect();
  });

  it("should create a category successfully", async () => {
    const category = await prisma.category.create({
      data: {
        name: "Test AI Accounts",
        slug: "test-ai-accounts",
        description: "Category for testing AI accounts",
      },
    });

    expect(category).toBeDefined();
    expect(category.id).toBeDefined();
    expect(category.name).toBe("Test AI Accounts");
    expect(category.slug).toBe("test-ai-accounts");
  });

  it("should create a product linked to the category", async () => {
    const category = await prisma.category.findUnique({
      where: { slug: "test-ai-accounts" },
    });
    expect(category).not.toBeNull();

    const product = await prisma.product.create({
      data: {
        title: "Test ChatGPT Plus 1 Month",
        slug: "test-chatgpt-plus",
        description: "Shared ChatGPT Plus account for testing",
        price: 99000,
        originalPrice: 150000,
        type: "ACCOUNT",
        categoryId: category!.id,
      },
      include: {
        category: true,
      },
    });

    expect(product).toBeDefined();
    expect(product.id).toBeDefined();
    expect(product.title).toBe("Test ChatGPT Plus 1 Month");
    expect(product.price).toBe(99000);
    expect(product.type).toBe("ACCOUNT");
    expect(product.category.slug).toBe("test-ai-accounts");
  });

  it("should create a product item and verify status default", async () => {
    const product = await prisma.product.findUnique({
      where: { slug: "test-chatgpt-plus" },
    });
    expect(product).not.toBeNull();

    const item = await prisma.productItem.create({
      data: {
        productId: product!.id,
        secretContent: "test_user@example.com|securePassword123",
      },
    });

    expect(item).toBeDefined();
    expect(item.status).toBe("AVAILABLE");
    expect(item.secretContent).toBe("test_user@example.com|securePassword123");
  });
});
