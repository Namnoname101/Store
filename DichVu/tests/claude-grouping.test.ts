import { describe, it, expect } from "vitest";
import { prisma } from "../src/lib/prisma";
import { processSectionProducts } from "../src/lib/catalog-grouping";

describe("Catalog Grouping with Claude API", () => {
  it("should group Claude API products into a grouped card with variants", async () => {
    const products = await prisma.product.findMany({
      where: {
        category: { slug: "ai-api" },
        isActive: true,
      },
      include: {
        category: true,
        supplierMapping: true,
      },
    });

    const productsWithStock = products.map((p) => ({
      ...p,
      stockCount: p.supplierMapping?.supplierStock || 0,
    }));

    const result = processSectionProducts(productsWithStock);
    console.log("Available brands in ai-api:", result.availableBrands);

    const claudeBrand = result.availableBrands.find((b) => b.key === "claude");
    expect(claudeBrand).toBeDefined();
    expect(claudeBrand?.name).toBe("Claude AI");
    expect(claudeBrand?.count).toBe(5);

    const claudeCard = result.items.find(
      (item) => item.type === "grouped" && item.groupKey === "claude"
    );
    expect(claudeCard).toBeDefined();
    expect(claudeCard?.groupedData?.variants.length).toBe(5);

    const variantLabels = claudeCard?.groupedData?.variants.map((v) => v.variantLabel);
    console.log("Claude variant labels:", variantLabels);
    expect(variantLabels).toContain("$10");
    expect(variantLabels).toContain("$30");
    expect(variantLabels).toContain("$50");
    expect(variantLabels).toContain("$100");
    expect(variantLabels).toContain("$5000");
  });
});
