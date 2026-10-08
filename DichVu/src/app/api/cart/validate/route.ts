import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableStockCount } from "@/services/inventory.service";

interface ValidateCartItemInput {
  productId: string;
  quantity: number;
  targetLink?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: ValidateCartItemInput[] = body?.items;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { valid: false, error: "Giỏ hàng không có sản phẩm nào được chọn." },
        { status: 400 }
      );
    }

    const productIds = items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        category: true,
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    let isValid = true;
    let subtotalAmount = 0;

    const validatedItems = await Promise.all(
      items.map(async (item) => {
        const dbProduct = productMap.get(item.productId);

        if (!dbProduct) {
          isValid = false;
          return {
            productId: item.productId,
            title: "Sản phẩm không tồn tại",
            price: 0,
            quantity: item.quantity,
            stockCount: 0,
            itemTotal: 0,
            hasError: true,
            errorMessage: "Sản phẩm không tồn tại trong hệ thống.",
          };
        }

        if (!dbProduct.isActive) {
          isValid = false;
          return {
            productId: dbProduct.id,
            title: dbProduct.title,
            price: dbProduct.price,
            quantity: item.quantity,
            stockCount: 0,
            itemTotal: 0,
            hasError: true,
            errorMessage: "Sản phẩm hiện đang tạm dừng bán.",
          };
        }

        const isSMM =
          dbProduct.category?.slug === "dich-vu-mxh" ||
          dbProduct.fulfillmentType === "API_DROPSHIP" ||
          dbProduct.title.toLowerCase().includes("tiktok") ||
          dbProduct.title.toLowerCase().includes("facebook");

        const liveStock = await getAvailableStockCount(dbProduct.id);
        const minQty = Math.max(1, dbProduct.minQuantity || (isSMM ? 50 : 1));
        const maxQty = dbProduct.maxQuantity || (isSMM ? 100000 : liveStock);

        if (item.quantity < minQty) {
          isValid = false;
          return {
            productId: dbProduct.id,
            title: dbProduct.title,
            price: dbProduct.price,
            quantity: item.quantity,
            stockCount: liveStock,
            itemTotal: dbProduct.price * item.quantity,
            hasError: true,
            errorMessage: `Số lượng tối thiểu là ${minQty}.`,
          };
        }

        if (item.quantity > maxQty) {
          isValid = false;
          return {
            productId: dbProduct.id,
            title: dbProduct.title,
            price: dbProduct.price,
            quantity: item.quantity,
            stockCount: liveStock,
            itemTotal: dbProduct.price * item.quantity,
            hasError: true,
            errorMessage: `Số lượng vượt quá giới hạn tối đa (${maxQty}).`,
          };
        }

        if (!isSMM && liveStock < item.quantity) {
          isValid = false;
          return {
            productId: dbProduct.id,
            title: dbProduct.title,
            price: dbProduct.price,
            quantity: item.quantity,
            stockCount: liveStock,
            itemTotal: dbProduct.price * item.quantity,
            hasError: true,
            errorMessage: `Kho chỉ còn ${liveStock} sản phẩm khả dụng.`,
          };
        }

        const itemTotal = dbProduct.price * item.quantity;
        subtotalAmount += itemTotal;

        return {
          productId: dbProduct.id,
          title: dbProduct.title,
          slug: dbProduct.slug,
          price: dbProduct.price, // Authoritative price from database
          quantity: item.quantity,
          stockCount: liveStock,
          itemTotal,
          hasError: false,
          errorMessage: null,
        };
      })
    );

    return NextResponse.json({
      valid: isValid,
      subtotalAmount,
      items: validatedItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: error?.message || "Không thể xác thực giỏ hàng." },
      { status: 500 }
    );
  }
}
