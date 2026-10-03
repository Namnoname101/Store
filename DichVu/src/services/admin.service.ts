import { prisma, ItemStatus, OrderStatus } from "@/lib/prisma";
import type { Category, Order, OrderItem, PaymentTransaction, Product, ProductItem } from "@prisma/client";

export interface AdminOverviewStats {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  lowStockProductsCount: number;
  recentOrders: Array<
    Order & {
      orderItems: Array<OrderItem & { product: Partial<Product> }>;
      transactions: PaymentTransaction[];
    }
  >;
}

export interface AdminProductItem extends Omit<Product, "items"> {
  category: Category;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  totalStock: number;
}

export interface AdminOrderDetail extends Order {
  upstreamStatus: string;
  upstreamOrderId: string | null;
  upstreamError: string | null;
  refundInfo: string | null;
  orderItems: Array<
    OrderItem & {
      product: {
        id: string;
        title: string;
        slug: string;
        type: string;
      };
    }
  >;
  deliveredItems: ProductItem[];
  transactions: PaymentTransaction[];
}

/**
 * Aggregates high-level admin metrics including total revenue, order counts,
 * and low-stock product count.
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const [revenueAgg, totalOrders, paidOrders, pendingOrders, productsWithStock, recentOrders] =
    await Promise.all([
      prisma.order.aggregate({
        where: { status: OrderStatus.PAID },
        _sum: { totalAmount: true },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PAID } }),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.product.findMany({
        select: {
          id: true,
          fulfillmentType: true,
          supplierMapping: {
            select: { supplierStock: true },
          },
          _count: {
            select: {
              items: {
                where: { status: ItemStatus.AVAILABLE },
              },
            },
          },
        },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          orderItems: {
            include: {
              product: {
                select: { id: true, title: true, slug: true, type: true },
              },
            },
          },
          transactions: true,
        },
      }),
    ]);

  const totalRevenue = revenueAgg._sum.totalAmount || 0;
  const lowStockProductsCount = productsWithStock.filter((p) => {
    const available =
      p.fulfillmentType === "API_DROPSHIP"
        ? p.supplierMapping?.supplierStock ?? 0
        : p._count.items;
    return available <= 5;
  }).length;

  return {
    totalRevenue,
    totalOrders,
    paidOrders,
    pendingOrders,
    lowStockProductsCount,
    recentOrders: recentOrders as any,
  };
}

/**
 * Returns all products along with their category and breakdown of stock status.
 */
export async function getAllProductsAdmin(): Promise<AdminProductItem[]> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      items: {
        select: { status: true },
      },
      supplierMapping: {
        select: { supplierStock: true },
      },
    },
  });

  return products.map(({ items, supplierMapping, ...product }) => {
    let availableStock = 0;
    let reservedStock = 0;
    let soldStock = 0;

    for (const item of items) {
      if (item.status === ItemStatus.AVAILABLE) availableStock++;
      else if (item.status === ItemStatus.RESERVED) reservedStock++;
      else if (item.status === ItemStatus.SOLD) soldStock++;
    }

    if (product.fulfillmentType === "API_DROPSHIP") {
      availableStock = supplierMapping?.supplierStock ?? 0;
    }

    return {
      ...product,
      availableStock,
      reservedStock,
      soldStock,
      totalStock:
        product.fulfillmentType === "API_DROPSHIP"
          ? availableStock + soldStock
          : items.length,
    };
  });
}

/**
 * Returns all orders with delivered keys and payment transactions, optionally filtered by status.
 */
export async function getAllOrdersAdmin(
  status?: string
): Promise<AdminOrderDetail[]> {
  const where = status ? { status } : {};

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
            },
          },
        },
      },
      deliveredItems: true,
      transactions: true,
    },
  });

  return orders as AdminOrderDetail[];
}

export const getAdminOrders = getAllOrdersAdmin;

