import { prisma, ItemStatus } from "@/lib/prisma";

export interface BulkImportResult {
  count: number;
  keys: string[];
}

/**
 * Splits raw multi-line input by newline, trims each item, and filters out empty lines.
 * Handles CRLF, extra spaces, and preserves key strings, credentials, and links.
 */
export function parseBulkKeys(rawText: string): string[] {
  if (!rawText || typeof rawText !== "string") {
    return [];
  }

  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Imports a batch of keys/credentials for a specified product.
 * Validates product existence and creates records with status AVAILABLE.
 */
export async function importKeysForProduct(
  productId: string,
  rawText: string
): Promise<BulkImportResult> {
  const keys = parseBulkKeys(rawText);

  if (keys.length === 0) {
    throw new Error("No valid keys provided");
  }

  // Ensure target product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, title: true },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Insert items in batch
  const createResult = await prisma.productItem.createMany({
    data: keys.map((secretContent) => ({
      productId,
      secretContent,
      status: ItemStatus.AVAILABLE,
    })),
  });

  return {
    count: createResult.count,
    keys,
  };
}
