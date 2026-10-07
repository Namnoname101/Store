import { NextResponse } from "next/server";
import { getBuffProgress } from "@/services/buff-progress.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    orderCode: string;
  } | Promise<{
    orderCode: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const orderCode = resolvedParams?.orderCode;

    if (!orderCode || typeof orderCode !== "string") {
      return NextResponse.json(
        { error: "Mã đơn hàng không hợp lệ." },
        { status: 400 }
      );
    }

    const progress = await getBuffProgress(orderCode);

    return NextResponse.json(progress);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Không thể lấy tiến trình đơn hàng.",
      },
      { status: 500 }
    );
  }
}
