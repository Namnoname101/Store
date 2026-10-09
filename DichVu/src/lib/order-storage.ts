export interface SavedOrder {
  orderCode: string;
  accessToken?: string | null;
  totalAmount: number;
  customerEmail?: string | null;
  createdAt: string;
  itemsSummary: string;
  status: string;
}

const STORAGE_KEY = "daitruong_recent_orders";
const LEGACY_STORAGE_KEY = "digistore_recent_orders";

/**
 * Saves or updates an order in client's LocalStorage.
 */
export function saveRecentOrder(order: SavedOrder): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getRecentOrders();
    const filtered = existing.filter((o) => o.orderCode !== order.orderCode);
    const updated = [order, ...filtered].slice(0, 20); // Keep max 20
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    // Silently handle quota errors
  }
}

/**
 * Retrieves all saved orders on this device.
 */
export function getRecentOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Removes an order from device storage.
 */
export function removeRecentOrder(orderCode: string): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getRecentOrders();
    const updated = existing.filter((o) => o.orderCode !== orderCode);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Clears all saved orders on this device.
 */
export function clearRecentOrders(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
