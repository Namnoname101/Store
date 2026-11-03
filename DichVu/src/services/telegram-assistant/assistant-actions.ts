import { prisma, OrderStatus, ItemStatus } from "@/lib/prisma";
import { getLiveProductStock } from "@/services/live-stock.service";
import { syncAllActiveSuppliers } from "@/services/pricing.service";

export interface ProductSummary {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  isActive: boolean;
  resellerPrice?: number;
  supplierCost?: number;
  localStock: number;
}

/**
 * 1. Lấy danh sách sản phẩm tóm tắt
 */
export async function getProductCatalog(options?: {
  onlyActive?: boolean;
  search?: string;
}): Promise<ProductSummary[]> {
  const where: any = {};
  if (options?.onlyActive) {
    where.isActive = true;
  }
  if (options?.search) {
    where.OR = [
      { title: { contains: options.search } },
      { slug: { contains: options.search.toLowerCase() } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      supplierMapping: true,
      items: {
        where: { status: ItemStatus.AVAILABLE },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return products.map((p) => {
    let resellerPrice: number | undefined;
    let supplierCost: number | undefined;

    if (p.supplierMapping?.customConfig) {
      try {
        const parsed = JSON.parse(p.supplierMapping.customConfig);
        resellerPrice = parsed.resellerPrice;
        supplierCost = parsed.supplierCost;
      } catch {
        // ignore JSON parse error
      }
    }

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      price: p.price,
      originalPrice: p.originalPrice,
      isActive: p.isActive,
      resellerPrice,
      supplierCost: supplierCost || p.supplierMapping?.supplierPrice,
      localStock: p.items.length,
    };
  });
}

/**
 * 2. Cập nhật giá sản phẩm (Giá bán lẻ và giá CTV)
 */
export async function updateProductPrice(
  slugOrId: string,
  newPrice: number,
  newResellerPrice?: number
): Promise<{ success: boolean; message: string; product?: any }> {
  const prod = await prisma.product.findFirst({
    where: {
      OR: [{ id: slugOrId }, { slug: slugOrId }, { title: { contains: slugOrId } }],
    },
    include: { supplierMapping: true },
  });

  if (!prod) {
    return { success: false, message: `Không tìm thấy sản phẩm khớp với "${slugOrId}"` };
  }

  const oldPrice = prod.price;

  let updatedConfig = prod.supplierMapping?.customConfig;
  if (prod.supplierMapping) {
    let confObj: any = {};
    try {
      confObj = prod.supplierMapping.customConfig ? JSON.parse(prod.supplierMapping.customConfig) : {};
    } catch {}

    confObj.retailPrice = newPrice;
    if (newResellerPrice !== undefined && newResellerPrice > 0) {
      confObj.resellerPrice = newResellerPrice;
    }
    updatedConfig = JSON.stringify(confObj);

    await prisma.supplierProductMapping.update({
      where: { id: prod.supplierMapping.id },
      data: {
        customConfig: updatedConfig,
        isAutoSync: false, // Don't let bot overwrite owner's manual override
      },
    });
  }

  const updatedProduct = await prisma.product.update({
    where: { id: prod.id },
    data: {
      price: newPrice,
    },
  });

  return {
    success: true,
    message: `Đã cập nhật giá "${updatedProduct.title}": ${oldPrice.toLocaleString("vi-VN")}đ ➔ ${newPrice.toLocaleString("vi-VN")}đ${
      newResellerPrice ? ` (Giá CTV: ${newResellerPrice.toLocaleString("vi-VN")}đ)` : ""
    }`,
    product: updatedProduct,
  };
}

/**
 * 3. Bật hoặc tắt trạng thái sản phẩm (Ẩn/Hiện trên Web)
 */
export async function toggleProductActive(
  slugOrId: string,
  isActive: boolean
): Promise<{ success: boolean; message: string; product?: any }> {
  const prod = await prisma.product.findFirst({
    where: {
      OR: [{ id: slugOrId }, { slug: slugOrId }, { title: { contains: slugOrId } }],
    },
  });

  if (!prod) {
    return { success: false, message: `Không tìm thấy sản phẩm "${slugOrId}"` };
  }

  const updated = await prisma.product.update({
    where: { id: prod.id },
    data: { isActive },
  });

  return {
    success: true,
    message: `Đã ${isActive ? "🟢 MỞ BÁN" : "🔴 TẠM DỪNG / ẨN"} sản phẩm "${updated.title}" trên trang web.`,
    product: updated,
  };
}

/**
 * 4. Báo cáo doanh thu & đơn hàng (Hôm nay, hôm qua, 7 ngày, tháng này)
 */
export async function getRevenueReport(
  period: "today" | "yesterday" | "week" | "month" = "today"
): Promise<{
  period: string;
  orderCount: number;
  totalRevenue: number;
  paidOrders: any[];
}> {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  if (period === "today") {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === "yesterday") {
    startDate.setDate(now.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setDate(now.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === "week") {
    startDate.setDate(now.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const paidOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PAID,
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      orderItems: {
        include: { product: true },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  const totalRevenue = paidOrders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

  return {
    period: period === "today" ? "Hôm nay" : period === "yesterday" ? "Hôm qua" : period === "week" ? "7 ngày qua" : "Tháng này",
    orderCount: paidOrders.length,
    totalRevenue,
    paidOrders: paidOrders.slice(0, 10),
  };
}

/**
 * 5. Tra cứu tồn kho trực tiếp từ bot nguồn & kho nội bộ
 */
export async function checkProductStock(slugOrId: string) {
  const prod = await prisma.product.findFirst({
    where: {
      OR: [{ id: slugOrId }, { slug: slugOrId }, { title: { contains: slugOrId } }],
    },
  });

  if (!prod) {
    return { success: false, message: `Không tìm thấy sản phẩm "${slugOrId}"` };
  }

  const live = await getLiveProductStock(prod.id, true);
  return {
    success: true,
    data: live,
    message: `📦 <b>${live.title}</b>\n• Tồn kho sẵn (Local): <b>${live.localStock}</b> slot\n• Tồn bot nguồn (Supplier): <b>${live.supplierStock}</b> slot\n• Tổng khả dụng: <b>${live.stockCount}</b> slot\n• Trạng thái: ${live.isAvailable ? "🟢 Đang mở bán" : "🔴 Đang hết hàng"}`,
  };
}

/**
 * 6. Kích hoạt đồng bộ nhà cung cấp
 */
export async function triggerSyncAllSuppliers() {
  const startTime = Date.now();
  const result = await syncAllActiveSuppliers();
  const durationMs = Date.now() - startTime;
  return {
    success: true,
    result,
    message: `⚡ <b>Đồng bộ Nhà cung cấp hoàn tất:</b>\n• Tổng mappings: <b>${result.totalMappings}</b>\n• Thành công: <b>${result.syncedCount}</b>\n• Hết hàng (tạm ẩn): <b>${result.pausedCount}</b>\n• Thời gian: <b>${durationMs}ms</b>`,
  };
}

/**
 * 7. Tra cứu chi tiết đơn hàng
 */
export async function lookupOrder(orderCode: string) {
  const cleanCode = orderCode.trim().toUpperCase();
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ orderCode: cleanCode }, { id: cleanCode }],
    },
    include: {
      orderItems: {
        include: { product: true },
      },
      deliveredItems: true,
    },
  });

  if (!order) {
    return { success: false, message: `Không tìm thấy đơn hàng "${orderCode}"` };
  }

  return {
    success: true,
    order,
  };
}
