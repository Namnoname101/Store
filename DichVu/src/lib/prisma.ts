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
  MOCK: "MOCK",
  TAPHOAMMO: "TAPHOAMMO",
  TRUMTHE: "TRUMTHE",
  LOCKET_VN: "LOCKET_VN",
  HACKTIM: "HACKTIM",
  CUSTOM_REST: "CUSTOM_REST",
  TELEGRAM_BOT: "TELEGRAM_BOT",
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

export const CouponType = {
  FIXED: "FIXED",
  PERCENT: "PERCENT",
} as const;
export type CouponType = (typeof CouponType)[keyof typeof CouponType];

export const DepositStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;
export type DepositStatus = (typeof DepositStatus)[keyof typeof DepositStatus];

export const WalletTransactionType = {
  TOPUP: "TOPUP",
  ORDER_PAYMENT: "ORDER_PAYMENT",
  REFUND: "REFUND",
  ADMIN_ADJUST: "ADMIN_ADJUST",
} as const;
export type WalletTransactionType = (typeof WalletTransactionType)[keyof typeof WalletTransactionType];

export const PaymentIntentStatus = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  PAID: "PAID",
  SUPERSEDED: "SUPERSEDED",
  CANCELLED: "CANCELLED",
} as const;
export type PaymentIntentStatus = (typeof PaymentIntentStatus)[keyof typeof PaymentIntentStatus];

export const ReconciliationStatus = {
  MATCHED: "MATCHED",
  UNDERPAID: "UNDERPAID",
  OVERPAID: "OVERPAID",
  MISMATCH_MEMO: "MISMATCH_MEMO",
  EXPIRED_PAYMENT: "EXPIRED_PAYMENT",
  MANUAL_RESOLVED: "MANUAL_RESOLVED",
  UNMATCHED_ORDER: "UNMATCHED_ORDER",
} as const;
export type ReconciliationStatus = (typeof ReconciliationStatus)[keyof typeof ReconciliationStatus];

export const AuditAction = {
  RECONCILE_MATCH: "RECONCILE_MATCH",
  RECONCILE_REFUND: "RECONCILE_REFUND",
  RECONCILE_DISMISS: "RECONCILE_DISMISS",
  OVERRIDE_FULFILLMENT: "OVERRIDE_FULFILLMENT",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

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
