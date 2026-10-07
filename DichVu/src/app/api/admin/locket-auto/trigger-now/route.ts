import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { LocketAutoWorker } from "@/services/locket-auto/locket-auto.worker";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
        { status: 401 }
      );
    }

    const worker = LocketAutoWorker.getInstance();
    const result = await worker.executeOnce();

    return NextResponse.json({
      ok: result.ok,
      status: result.status,
      jobId: result.jobId,
      message: result.message,
      durationMs: result.durationMs,
      rawPayload: result.rawPayload,
      workerStatus: worker.getStatus(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Lỗi kích hoạt ngay" },
      { status: 500 }
    );
  }
}
