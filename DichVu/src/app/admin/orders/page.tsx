import { getAllOrdersAdmin } from "@/services/admin.service";
import OrdersManagerClient from "@/components/admin/OrdersManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAllOrdersAdmin();

  return <OrdersManagerClient initialOrders={orders} />;
}
