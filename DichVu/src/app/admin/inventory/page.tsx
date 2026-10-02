import { Suspense } from "react";
import { getAllProductsAdmin } from "@/services/admin.service";
import InventoryImporterClient from "@/components/admin/InventoryImporterClient";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const products = await getAllProductsAdmin();

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-slate-500">
          Đang tải dữ liệu kho hàng...
        </div>
      }
    >
      <InventoryImporterClient initialProducts={products} />
    </Suspense>
  );
}
