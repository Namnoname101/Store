import { prisma, ItemStatus, FulfillmentType } from "@/lib/prisma";
import { getSupplierAdapter } from "@/services/suppliers/adapter.registry";

export interface LiveStockResult {
  productId: string;
  slug: string;
  title: string;
  stockCount: number;
  localStock: number;
  supplierStock: number;
  isAvailable: boolean;
  supplierPrice?: number;
  lastCheckedAt: string;
  fromCache: boolean;
}

interface StockCacheEntry {
  timestamp: number;
  data: LiveStockResult;
}

const STOCK_CACHE_TTL_MS = 30 * 1000; // 30 seconds debounce window
const stockCache = new Map<string, StockCacheEntry>();
const inFlightRequests = new Map<string, Promise<LiveStockResult>>();

/**
 * Checks live stock for a product on-demand.
 * Uses Single-Flight Request Deduplication to prevent spamming upstream bots/APIs
 * when multiple users access the same product simultaneously.
 */
export async function getLiveProductStock(
  productIdOrSlug: string,
  forceRefresh: boolean = false
): Promise<LiveStockResult> {
  const cacheKey = productIdOrSlug.trim();
  const now = Date.now();

  // 1. Check in-memory cache if not forced
  if (!forceRefresh) {
    const cached = stockCache.get(cacheKey);
    if (cached && now - cached.timestamp < STOCK_CACHE_TTL_MS) {
      return {
        ...cached.data,
        fromCache: true,
      };
    }
  }

  // 2. Single-Flight Deduplication: If a query is already running, await it
  if (inFlightRequests.has(cacheKey)) {
    return await inFlightRequests.get(cacheKey)!;
  }

  // 3. Initiate fresh check
  const checkPromise = executeLiveStockCheck(productIdOrSlug);
  inFlightRequests.set(cacheKey, checkPromise);

  try {
    const result = await checkPromise;
    stockCache.set(cacheKey, { timestamp: Date.now(), data: result });
    if (result.slug && result.slug !== cacheKey) {
      stockCache.set(result.slug, { timestamp: Date.now(), data: result });
    }
    if (result.productId && result.productId !== cacheKey) {
      stockCache.set(result.productId, { timestamp: Date.now(), data: result });
    }
    return result;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

async function executeLiveStockCheck(productIdOrSlug: string): Promise<LiveStockResult> {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
    },
    include: {
      supplierMapping: {
        include: {
          supplier: true,
        },
      },
    },
  });

  if (!product) {
    return {
      productId: productIdOrSlug,
      slug: "",
      title: "Unknown",
      stockCount: 0,
      localStock: 0,
      supplierStock: 0,
      isAvailable: false,
      lastCheckedAt: new Date().toISOString(),
      fromCache: false,
    };
  }

  // Count local warehouse stock
  const localStock = await prisma.productItem.count({
    where: {
      productId: product.id,
      status: ItemStatus.AVAILABLE,
    },
  });

  let liveSupplierStock = product.supplierMapping?.supplierStock || 0;
  let supplierPrice = product.supplierMapping?.supplierPrice;

  // If dropship with active supplier adapter, query live info
  if (
    product.fulfillmentType === FulfillmentType.API_DROPSHIP &&
    product.supplierMapping?.supplier?.isActive
  ) {
    try {
      const adapter = getSupplierAdapter(product.supplierMapping.supplier.type);
      const info = await adapter.fetchProductInfo(
        {
          baseUrl: product.supplierMapping.supplier.baseUrl,
          apiKey: product.supplierMapping.supplier.apiKey,
          apiSecret: product.supplierMapping.supplier.apiSecret,
        },
        product.supplierMapping.supplierProductCode
      );

      liveSupplierStock = Math.max(0, info.inStock);
      supplierPrice = info.price;

      // If primary supplier is out of stock, check alternative suppliers for fallback stock
      if (liveSupplierStock === 0 && product.supplierMapping?.customConfig) {
        try {
          const parsed = JSON.parse(product.supplierMapping.customConfig);
          if (Array.isArray(parsed.alternativeSuppliers)) {
            for (const alt of parsed.alternativeSuppliers) {
              const altSupplier = await prisma.supplier.findFirst({
                where: {
                  OR: [
                    { code: alt.supplierCode },
                    { id: alt.supplierId },
                  ],
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
                  liveSupplierStock += altInfo.inStock;
                  if (!supplierPrice || supplierPrice <= 0) {
                    supplierPrice = altInfo.price;
                  }
                }
              }
            }
          }
        } catch {
          // ignore customConfig parsing errors
        }
      }

      // Persist updated stock & code if detected
      await prisma.supplierProductMapping.update({
        where: { id: product.supplierMapping.id },
        data: {
          supplierProductCode: info.supplierProductCode || product.supplierMapping.supplierProductCode,
          supplierStock: liveSupplierStock,
          supplierPrice: supplierPrice,
          lastSyncAt: new Date(),
        },
      });

      // Update product status
      const totalAvail = localStock + liveSupplierStock;
      if (totalAvail === 0 && product.isActive) {
        await prisma.product.update({
          where: { id: product.id },
          data: { isActive: false },
        });
        product.isActive = false;
      } else if (totalAvail > 0 && !product.isActive) {
        await prisma.product.update({
          where: { id: product.id },
          data: { isActive: true },
        });
        product.isActive = true;
      }
    } catch (err: any) {
      console.warn(
        `[LiveStockService] Failed to fetch live supplier stock for ${product.slug}:`,
        err?.message || err
      );
      liveSupplierStock = Math.max(0, product.supplierMapping.supplierStock);
    }
  }

  const totalStock = localStock + liveSupplierStock;
  const isAvailable = product.isActive && totalStock > 0;

  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    stockCount: totalStock,
    localStock,
    supplierStock: liveSupplierStock,
    isAvailable,
    supplierPrice,
    lastCheckedAt: new Date().toISOString(),
    fromCache: false,
  };
}
