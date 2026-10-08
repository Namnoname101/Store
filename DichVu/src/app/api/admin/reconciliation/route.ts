import { NextRequest, NextResponse } from "next/server";
import { getPendingReconciliations } from "@/services/admin-reconciliation.service";

export async function GET(_req: NextRequest) {
  try {
    const data = await getPendingReconciliations();
    return NextResponse.json({ success: true, ...data }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch pending reconciliations:", error);
    return NextResponse.json(
      { error: error?.message || "Lỗi lấy danh sách đối soát" },
      { status: 500 }
    );
  }
}
