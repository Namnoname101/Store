import { redirect } from "next/navigation";

interface OrdersPageRouteProps {
  params: { orderCode: string };
  searchParams?: { token?: string };
}

export default async function OrdersPageRoute({
  params,
  searchParams,
}: OrdersPageRouteProps) {
  const { orderCode } = await Promise.resolve(params);
  const tokenQuery = searchParams?.token
    ? `?token=${encodeURIComponent(searchParams.token)}`
    : "";
  redirect(`/order-success/${orderCode}${tokenQuery}`);
}
