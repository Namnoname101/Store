import { NextRequest, NextResponse } from "next/server";
import { prisma, ProductType } from "@/lib/prisma";
import { getAllProductsAdmin } from "@/services/admin.service";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET() {
  try {
    const products = await getAllProductsAdmin();
    return NextResponse.json({ success: true, products }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      description,
      price,
      originalPrice,
      type = ProductType.LICENSE_KEY,
      thumbnailUrl,
      isActive = true,
      categoryId,
      categoryName,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Product title is required" },
        { status: 400 }
      );
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json(
        { error: "Valid price (VND) is required" },
        { status: 400 }
      );
    }

    // Determine category
    let finalCategoryId = categoryId;

    if (!finalCategoryId && categoryName && typeof categoryName === "string" && categoryName.trim()) {
      const catSlug = slugify(categoryName.trim());
      const cat = await prisma.category.upsert({
        where: { slug: catSlug || `cat-${Date.now()}` },
        update: {},
        create: {
          name: categoryName.trim(),
          slug: catSlug || `cat-${Date.now()}`,
          description: `Danh mục ${categoryName.trim()}`,
        },
      });
      finalCategoryId = cat.id;
    }

    if (!finalCategoryId) {
      // Find default category or create a general one
      const defaultCat = await prisma.category.findFirst();
      if (defaultCat) {
        finalCategoryId = defaultCat.id;
      } else {
        const newCat = await prisma.category.create({
          data: {
            name: "Chung",
            slug: "chung",
            description: "Sản phẩm chung",
          },
        });
        finalCategoryId = newCat.id;
      }
    }

    // Generate or sanitize slug
    let targetSlug = slug && typeof slug === "string" && slug.trim()
      ? slugify(slug.trim())
      : slugify(title.trim());

    if (!targetSlug) {
      targetSlug = `product-${Date.now()}`;
    }

    // Ensure unique slug
    const existing = await prisma.product.findUnique({
      where: { slug: targetSlug },
    });
    if (existing) {
      targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
    }

    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        slug: targetSlug,
        description: (description && typeof description === "string" ? description.trim() : "") || title.trim(),
        price: Math.round(Number(price)),
        originalPrice: originalPrice ? Math.round(Number(originalPrice)) : null,
        type: Object.values(ProductType).includes(type) ? type : ProductType.LICENSE_KEY,
        thumbnailUrl: thumbnailUrl?.trim() || null,
        isActive: Boolean(isActive),
        categoryId: finalCategoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
