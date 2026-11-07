import { prisma, MarkupType } from "@/lib/prisma";
import { getSupplierAdapter } from "@/services/suppliers/adapter.registry";

export interface SyncProductResult {
  success: boolean;
  mappingId: string;
  productId: string;
  supplierProductCode: string;
  oldSupplierPrice: number;
  newSupplierPrice: number;
  supplierPrice: number;
  oldRetailPrice: number;
  newRetailPrice: number;
  retailPrice: number;
  inStock: number;
  isActive: boolean;
  isPaused: boolean;
  error?: string;
}

export interface BulkSyncError {
  mappingId: string;
  error: string;
}

export interface BulkSyncResult {
  totalMappings: number;
  syncedCount: number;
  pausedCount: number;
  errors: BulkSyncError[];
}

/**
 * Calculates normalized retail price based on supplier cost and markup rules.
 * Automatically rounds to the nearest 1,000 VND.
 * Enforces Loss Prevention Guard: retail price is never strictly less than supplier price.
 */
export function calculateRetailPrice(
  supplierPrice: number,
  markupType: string,
  markupValue: number
): number {
  let basePrice = supplierPrice;
  const normalizedType = markupType?.toUpperCase();

  if (normalizedType === MarkupType.PERCENTAGE) {
    basePrice = supplierPrice * (1 + markupValue / 100);
  } else if (normalizedType === MarkupType.FIXED_AMOUNT) {
    basePrice = supplierPrice + markupValue;
  } else {
    basePrice = supplierPrice + markupValue;
  }

  // For micro-transactions/SMM buff services (< 1,000 VND per unit), preserve exact integer price.
  // For standard products (keys, accounts >= 1,000 VND), round to nearest 1,000 VND.
  let retailPrice: number;
  if (basePrice < 1000) {
    retailPrice = Math.round(basePrice);
  } else {
    retailPrice = Math.round(basePrice / 1000) * 1000;
  }

  // Guard: Retail price must never be strictly less than supplierPrice
  if (retailPrice < supplierPrice) {
    retailPrice = supplierPrice;
  }

  return retailPrice;
}

/**
 * Synchronizes single product price and stock status directly from upstream supplier.
 * Updates supplier mapping price, recalculates retail price, and handles auto-pausing
 * when product is out of stock. Supports multi-supplier fallback checks.
 */
export async function syncProductFromSupplier(
  mappingId: string
): Promise<SyncProductResult> {
  const mapping = await prisma.supplierProductMapping.findUnique({
    where: { id: mappingId },
    include: {
      product: true,
      supplier: true,
    },
  });

  if (!mapping) {
    throw new Error(`Supplier product mapping not found: ${mappingId}`);
  }

  if (!mapping.product) {
    throw new Error(`Product not found for mapping: ${mappingId}`);
  }

  if (!mapping.supplier) {
    throw new Error(`Supplier not found for mapping: ${mappingId}`);
  }

  const adapter = getSupplierAdapter(mapping.supplier.type);
  const info = await adapter.fetchProductInfo(
    {
      baseUrl: mapping.supplier.baseUrl,
      apiKey: mapping.supplier.apiKey,
      apiSecret: mapping.supplier.apiSecret,
    },
    mapping.supplierProductCode
  );

  let totalStock = Math.max(0, info.inStock);
  let effectiveSupplierPrice = info.price > 0 ? info.price : mapping.supplierPrice;

  // Check alternative suppliers if primary supplier is out of stock
  if (totalStock === 0 && mapping.customConfig) {
    try {
      const parsed = JSON.parse(mapping.customConfig);
      if (Array.isArray(parsed.alternativeSuppliers)) {
        for (const alt of parsed.alternativeSuppliers) {
          const altSupplier = await prisma.supplier.findFirst({
            where: {
              OR: [{ code: alt.supplierCode }, { id: alt.supplierId }],
              isActive: true,
            },
          });
          if (altSupplier) {
            const altAdapter = getSupplierAdapter(altSupplier.type);
            const altInfo = await altAdapter.fetchProductInfo(
              {
                baseUrl: altSupplier.baseUrl,
                apiKey: altSupplier.apiKey,
                apiSecret: altSupplier.apiSecret,
              },
              alt.supplierProductCode
            );
            if (altInfo.inStock > 0) {
              totalStock += altInfo.inStock;
              if (effectiveSupplierPrice <= 0) {
                effectiveSupplierPrice = altInfo.price;
              }
            }
          }
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  const shouldBeActive = totalStock > 0;
  // Price Lock Guard: if isAutoSync is false, preserve the admin's manual fixed price
  const targetRetailPrice = mapping.isAutoSync
    ? calculateRetailPrice(effectiveSupplierPrice, mapping.markupType, mapping.markupValue)
    : mapping.product.price;

  const [updatedMapping, updatedProduct] = await prisma.$transaction([
    prisma.supplierProductMapping.update({
      where: { id: mappingId },
      data: {
        supplierProductCode: info.supplierProductCode || mapping.supplierProductCode,
        supplierPrice: effectiveSupplierPrice,
        supplierStock: totalStock,
        lastSyncAt: new Date(),
      },
    }),
    prisma.product.update({
      where: { id: mapping.productId },
      data: {
        price: targetRetailPrice,
        isActive: shouldBeActive,
      },
    }),
  ]);

  return {
    success: true,
    mappingId: mapping.id,
    productId: mapping.productId,
    supplierProductCode: mapping.supplierProductCode,
    oldSupplierPrice: mapping.supplierPrice,
    newSupplierPrice: updatedMapping.supplierPrice,
    supplierPrice: updatedMapping.supplierPrice,
    oldRetailPrice: mapping.product.price,
    newRetailPrice: updatedProduct.price,
    retailPrice: updatedProduct.price,
    inStock: totalStock,
    isActive: updatedProduct.isActive,
    isPaused: !updatedProduct.isActive,
  };
}

/**
 * Iterates through all active mappings where auto-sync is enabled and synchronizes
 * pricing and inventory from suppliers. Handles individual errors gracefully.
 */
export async function syncAllActiveSuppliers(): Promise<BulkSyncResult> {
  const mappings = await prisma.supplierProductMapping.findMany({
    where: {
      isAutoSync: true,
      supplier: {
        isActive: true,
      },
    },
    select: {
      id: true,
    },
  });

  const totalMappings = mappings.length;
  let syncedCount = 0;
  let pausedCount = 0;
  const errors: BulkSyncError[] = [];

  for (const mapping of mappings) {
    try {
      const result = await syncProductFromSupplier(mapping.id);
      syncedCount++;
      if (result.isPaused) {
        pausedCount++;
      }
    } catch (err: any) {
      errors.push({
        mappingId: mapping.id,
        error: err?.message || String(err),
      });
    }

    // Throttle supplier API requests to prevent supplier IP rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return {
    totalMappings,
    syncedCount,
    pausedCount,
    errors,
  };
}
