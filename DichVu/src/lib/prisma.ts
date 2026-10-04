import { PrismaClient } from "@prisma/client";

export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ProductType = {
  LICENSE_KEY: "LICENSE_KEY",
  ACCOUNT: "ACCOUNT",
  COURSE_LINK: "COURSE_LINK",
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const ItemStatus = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  SOLD: "SOLD",
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const FulfillmentType = {
  LOCAL_STOCK: "LOCAL_STOCK",
  API_DROPSHIP: "API_DROPSHIP",
} as const;
export type FulfillmentType = (typeof FulfillmentType)[keyof typeof FulfillmentType];

export const SupplierType = {
  TAPHOAMMO: "TAPHOAMMO",
  TRUMTHE: "TRUMTHE",
  LOCKET_VN: "LOCKET_VN",
  HACKTIM: "HACKTIM",
  CUSTOM_REST: "CUSTOM_REST",
} as const;
export type SupplierType = (typeof SupplierType)[keyof typeof SupplierType];

export const MarkupType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
} as const;
export type MarkupType = (typeof MarkupType)[keyof typeof MarkupType];

export const UpstreamStatus = {
  NOT_APPLICABLE: "NOT_APPLICABLE",
  PENDING_UPSTREAM: "PENDING_UPSTREAM",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type UpstreamStatus = (typeof UpstreamStatus)[keyof typeof UpstreamStatus];

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
