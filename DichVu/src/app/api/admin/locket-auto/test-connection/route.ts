import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { LocketAutoService } from "@/services/locket-auto/locket-auto.service";
import { LocketPartnerClient } from "@/services/locket-auto/locket-partner.client";

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

    const body = await req.json().catch(() => ({}));
    const currentConfig = await LocketAutoService.getConfig();

    let passId = body.passId || currentConfig?.passId;
    let linkVersion = body.linkVersion || currentConfig?.linkVersion || 1;
    let signature = body.signature || currentConfig?.signature;
    const cookie = body.sessionCookie || currentConfig?.sessionCookie;

    if (body.goldPassUrl && body.goldPassUrl.trim() !== "") {
      try {
        const parsed = LocketPartnerClient.parseUrl(body.goldPassUrl);
        passId = parsed.passId;
        linkVersion = parsed.linkVersion;
        signature = parsed.signature;
      } catch (parseErr: any) {
        return NextResponse.json(
          { ok: false, error: parseErr?.message || "URL GoldPass không hợp lệ" },
          { status: 400 }
        );
      }
    }

    if (!passId || !signature || !cookie) {
      return NextResponse.json(
        {
          ok: false,
          error: "Vui lòng cung cấp link GoldPass và Session Cookie để kiểm tra kết nối.",
        },
        { status: 400 }
      );
    }

    const result = await LocketPartnerClient.testAccess({
      passId,
      linkVersion,
      signature,
      cookie,
    });

    if (result.ok && result.targetUsername) {
      await LocketAutoService.saveConfig({
        targetUsername: result.targetUsername,
      });
    }

    return NextResponse.json({
      ok: result.ok,
      targetUsername: result.targetUsername,
      statusLabel: result.statusLabel,
      cooldownRemaining: result.cooldownRemaining,
      error: result.error,
      rawPayload: result.rawPayload,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Lỗi kiểm tra kết nối đối tác" },
      { status: 500 }
    );
  }
}
