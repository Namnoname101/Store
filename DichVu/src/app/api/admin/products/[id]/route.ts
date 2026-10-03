import { NextRequest, NextResponse } from "next/server";
import { prisma, ProductType } from "@/lib/prisma";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        supplierMapping: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      description,
      price,
      originalPrice,
      type,
      thumbnailUrl,
      isActive,
      categoryId,
    } = body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return NextResponse.json(
          { error: "Product title cannot be empty" },
          { status: 400 }
        );
      }
      dataToUpdate.title = title.trim();
    }

    if (description !== undefined) {
      dataToUpdate.description = typeof description === "string" ? description.trim() : "";
    }

    if (price !== undefined) {
      if (isNaN(Number(price)) || Number(price) < 0) {
        return NextResponse.json(
          { error: "Valid price is required" },
          { status: 400 }
        );
      }
      dataToUpdate.price = Math.round(Number(price));
    }

    if (originalPrice !== undefined) {
      dataToUpdate.originalPrice =
        originalPrice !== null && !isNaN(Number(originalPrice)) && Number(originalPrice) > 0
          ? Math.round(Number(originalPrice))
          : null;
    }

    if (type !== undefined && Object.values(ProductType).includes(type)) {
      dataToUpdate.type = type;
    }

    if (thumbnailUrl !== undefined) {
      dataToUpdate.thumbnailUrl = thumbnailUrl ? thumbnailUrl.trim() : null;
    }

    if (isActive !== undefined) {
      dataToUpdate.isActive = Boolean(isActive);
    }

    if (categoryId !== undefined && categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (cat) {
        dataToUpdate.categoryId = categoryId;
      }
    }

    if (slug && typeof slug === "string" && slug.trim()) {
      const targetSlug = slugify(slug.trim());
      if (targetSlug !== existingProduct.slug) {
        const conflict = await prisma.product.findUnique({
          where: { slug: targetSlug },
        });
        if (conflict && conflict.id !== params.id) {
          return NextResponse.json(
            { error: "Slug already exists. Please choose another one." },
            { status: 400 }
          );
        }
        dataToUpdate.slug = targetSlug;
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        category: true,
        supplierMapping: true,
      },
    });

    return NextResponse.json(
      { success: true, product: updatedProduct },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If order items exist, soft-delete by deactivating
    if (existing._count.orderItems > 0) {
      const softDeleted = await prisma.product.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json(
        {
          success: true,
          message: "Sản phẩm đã có đơn hàng nên được chuyển sang trạng thái Tạm ẩn (Inactive).",
          product: softDeleted,
        },
        { status: 200 }
      );
    }

    // Otherwise, clean up items and mapping then delete
    await prisma.$transaction([
      prisma.supplierProductMapping.deleteMany({ where: { productId: params.id } }),
      prisma.productItem.deleteMany({ where: { productId: params.id } }),
      prisma.product.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json(
      { success: true, message: "Đã xóa sản phẩm thành công." },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
