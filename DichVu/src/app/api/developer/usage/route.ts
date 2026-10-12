import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { computeKeyFingerprint, getAuthenticatedUser } from "@/lib/key-security";
import { ModelApiService } from "@/services/modelapi/modelapi.service";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const customHeader = req.headers.get("x-api-key");
    const queryKey = req.nextUrl.searchParams.get("apiKey");

    let apiKey = (customHeader || queryKey || "").trim();
    if (!apiKey && authHeader?.startsWith("Bearer ")) {
      apiKey = authHeader.replace("Bearer ", "").trim();
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp API Key qua header x-api-key hoặc tham số apiKey" },
        { status: 401 }
      );
    }

    // 1. Verify that this key belongs to DaiTruong Store
    const fingerprint = computeKeyFingerprint(apiKey);
    const binding = await prisma.customerApiKeyBinding.findUnique({
      where: { keyFingerprint: fingerprint },
    });

    if (!binding) {
      return NextResponse.json(
        { error: "API Key không thuộc hệ thống DaiTruong Store hoặc chưa được kích hoạt" },
        { status: 404 }
      );
    }

    // 2. IDOR check if bound to a user
    const authUser = await getAuthenticatedUser(req);
    if (binding.userId && authUser && authUser.userId !== binding.userId) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập thông tin API Key này" },
        { status: 403 }
      );
    }

    // 3. Query upstream usage
    const upstreamRes = await ModelApiService.fetchTokenUsage(apiKey);
    const rawData = upstreamRes?.data || {};

    const quota = Number(rawData.quota || 0);
    const usedQuota = Number(rawData.used_quota || 0);
    const totalQuota = quota + usedQuota;

    const balanceUsd = ModelApiService.quotaToUsd(quota);
    const usedUsd = ModelApiService.quotaToUsd(usedQuota);
    const consumptionRate =
      totalQuota > 0 ? Number(((usedQuota / totalQuota) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      quota,
      usedQuota,
      balanceUsd,
      usedUsd,
      consumptionRate,
      maskedKey: binding.maskedKey,
      keyName: binding.keyName || "API Key của bạn",
      status: binding.status,
      lastSyncedAt: binding.lastSyncedAt,
      isLowCredit: balanceUsd < 1.0,
    });
  } catch (err: any) {
    console.error("[GET /api/developer/usage Error]:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ khi truy vấn thông tin usage" },
      { status: 500 }
    );
  }
}
