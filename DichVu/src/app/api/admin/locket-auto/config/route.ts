import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { LocketAutoService, SaveConfigData } from "@/services/locket-auto/locket-auto.service";
import { LocketAutoWorker } from "@/services/locket-auto/locket-auto.worker";
import { LocketPartnerClient } from "@/services/locket-auto/locket-partner.client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
        { status: 401 }
      );
    }

    const config = await LocketAutoService.getConfig();
    const worker = LocketAutoWorker.getInstance();

    // Tự động khôi phục nhịp worker nếu cấu hình đang bật isActive mà worker chưa chạy
    if (config?.isActive && !worker.isRunning()) {
      worker.start().catch((err) => {
        console.error("[LocketAutoWorker] Background auto-start failed:", err);
      });
    }

    return NextResponse.json({
      ok: true,
      config,
      workerStatus: worker.getStatus(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Lỗi lấy cấu hình Locket Auto" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const savePayload: SaveConfigData = {};

    if (body.goldPassUrl !== undefined) {
      savePayload.goldPassUrl = body.goldPassUrl;
      if (body.goldPassUrl && body.goldPassUrl.trim() !== "") {
        try {
          const parsed = LocketPartnerClient.parseUrl(body.goldPassUrl);
          savePayload.passId = parsed.passId;
          savePayload.linkVersion = parsed.linkVersion;
          savePayload.signature = parsed.signature;
        } catch (parseErr: any) {
          return NextResponse.json(
            { ok: false, error: parseErr?.message || "URL GoldPass không hợp lệ" },
            { status: 400 }
          );
        }
      }
    }

    if (body.passId !== undefined) savePayload.passId = body.passId;
    if (body.linkVersion !== undefined) savePayload.linkVersion = body.linkVersion;
    if (body.signature !== undefined) savePayload.signature = body.signature;
    if (body.sessionCookie !== undefined) savePayload.sessionCookie = body.sessionCookie;
    if (body.csrfToken !== undefined) savePayload.csrfToken = body.csrfToken;
    if (body.targetUsername !== undefined) savePayload.targetUsername = body.targetUsername;
    if (body.isActive !== undefined) savePayload.isActive = body.isActive;
    if (body.intervalSeconds !== undefined) savePayload.intervalSeconds = Number(body.intervalSeconds);

    const saved = await LocketAutoService.saveConfig(savePayload);
    const worker = LocketAutoWorker.getInstance();

    if (saved.isActive) {
      await worker.start();
    } else {
      worker.stop();
    }

    return NextResponse.json({
      ok: true,
      config: saved,
      workerStatus: worker.getStatus(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Lỗi lưu cấu hình Locket Auto" },
      { status: 500 }
    );
  }
}
