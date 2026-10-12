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

    // 1. Verify key ownership in DaiTruong Store
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

    // 2. IDOR check
    const authUser = await getAuthenticatedUser(req);
    if (binding.userId && authUser && authUser.userId !== binding.userId) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập thông tin API Key này" },
        { status: 403 }
      );
    }

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(req.nextUrl.searchParams.get("pageSize") || "20", 10))
    );

    // 3. Query logs from upstream
    const upstreamRes = await ModelApiService.fetchTokenLogs(apiKey, page, pageSize);

    const rawLogs = Array.isArray(upstreamRes?.data) ? upstreamRes.data : [];
    const total = Number(upstreamRes?.total || rawLogs.length);

    // Format logs cleanly for developer UI
    const formattedLogs = rawLogs.map((log: any) => ({
      id: log.id,
      createdAt: log.created_at ? new Date(log.created_at * 1000).toISOString() : new Date().toISOString(),
      model_name: log.model_name || "unknown",
      quota: Number(log.quota || 0),
      prompt_tokens: Number(log.prompt_tokens || 0),
      completion_tokens: Number(log.completion_tokens || 0),
      total_tokens: Number(log.prompt_tokens || 0) + Number(log.completion_tokens || 0),
      costUsd: ModelApiService.quotaToUsd(Number(log.quota || 0)),
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      page,
      pageSize,
      total,
      maskedKey: binding.maskedKey,
    });
  } catch (err: any) {
    console.error("[GET /api/developer/logs Error]:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ khi truy vấn nhật ký request" },
      { status: 500 }
    );
  }
}
