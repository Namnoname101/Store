import { NextRequest, NextResponse } from "next/server";
import { resolveReconciliation } from "@/services/admin-reconciliation.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { action, orderCode, note, refundProof, refundStatus } = body;

    if (!action || !["MATCH_AND_FULFILL", "MARK_REFUNDED", "DISMISS"].includes(action)) {
      return NextResponse.json(
        { error: "Hành động đối soát không hợp lệ" },
        { status: 400 }
      );
    }

    const result = await resolveReconciliation(id, action, {
      orderCode,
      note,
      refundProof,
      refundStatus,
      performedBy: "OWNER",
    });

    return NextResponse.json({ ...result }, { status: 200 });
  } catch (error: any) {
    console.error("Resolve reconciliation error:", error);
    return NextResponse.json(
      { error: error?.message || "Lỗi xử lý đối soát" },
      { status: 500 }
    );
  }
}
