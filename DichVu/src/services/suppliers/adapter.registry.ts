import { SupplierType } from "../../lib/prisma";
import { ISupplierAdapter } from "./supplier-adapter.interface";
import { TaphoammoAdapter } from "./adapters/taphoammo.adapter";
import { TrumtheAdapter } from "./adapters/trumthe.adapter";
import { LocketAdapter } from "./adapters/locket.adapter";
import { HackTimAdapter } from "./adapters/hacktim.adapter";
import { TelegramBotAdapter } from "./adapters/telegram-bot.adapter";
import { GenzShopAdapter } from "./adapters/genzshop.adapter";
import { CanbosoAdapter } from "./adapters/canboso.adapter";
import { DbotAdapter } from "./adapters/dbot.adapter";
import { KhoMmoAdapter } from "./adapters/khommo.adapter";

const adapterRegistry = new Map<string, ISupplierAdapter>();

function initDefaultAdapters(): void {
  adapterRegistry.clear();
  const taphoa = new TaphoammoAdapter();
  const trumthe = new TrumtheAdapter();
  const locket = new LocketAdapter();
  const hacktim = new HackTimAdapter();
  const telegramBot = new TelegramBotAdapter();
  const genzshop = new GenzShopAdapter();
  const canboso = new CanbosoAdapter();
  const dbot = new DbotAdapter();
  const khommo = new KhoMmoAdapter();

  adapterRegistry.set(SupplierType.TAPHOAMMO, taphoa);
  adapterRegistry.set(SupplierType.TRUMTHE, trumthe);
  adapterRegistry.set(SupplierType.LOCKET_VN, locket);
  adapterRegistry.set(SupplierType.HACKTIM, hacktim);
  adapterRegistry.set(SupplierType.GENZSHOP, genzshop);
  adapterRegistry.set(SupplierType.CUSTOM_REST, taphoa);
  adapterRegistry.set(SupplierType.TELEGRAM_BOT, telegramBot);

  // New REST API Suppliers
  adapterRegistry.set("CANBOSO_BUYER", canboso);
  adapterRegistry.set("DKEY", canboso);
  adapterRegistry.set("HXN", canboso);
  adapterRegistry.set("DBOT_API", dbot);
  adapterRegistry.set("CHODAUMOI", dbot);
  adapterRegistry.set("KHOMMO_API", khommo);
  adapterRegistry.set("KHOMMO", khommo);
}

initDefaultAdapters();

export function registerSupplierAdapter(
  type: string,
  adapter: ISupplierAdapter
): void {
  adapterRegistry.set(type.toUpperCase(), adapter);
}

export function getSupplierAdapter(type: string): ISupplierAdapter {
  const normalized = type?.toUpperCase();
  const adapter = adapterRegistry.get(normalized);
  if (!adapter) {
    throw new Error(`Unsupported supplier type: ${type}`);
  }
  return adapter;
}

export function resetAdapterRegistry(): void {
  initDefaultAdapters();
}
