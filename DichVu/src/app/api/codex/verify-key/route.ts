import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ModelApiService } from "@/services/modelapi/modelapi.service";
import { computeKeyFingerprint, maskApiKey, getAuthenticatedUser } from "@/lib/key-security";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Dữ liệu JSON không hợp lệ" },
        { status: 400 }
      );
    }

    const { apiKey, email } = body || {};

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "Vui lòng nhập API Key" },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();

    // Validates key format: must start with sk- and have minimum 10 characters
    if (!trimmedKey.startsWith("sk-") || trimmedKey.length < 10) {
      return NextResponse.json(
        { error: "API Key không đúng định dạng (phải bắt đầu bằng 'sk-' và có tối thiểu 10 ký tự)" },
        { status: 400 }
      );
    }

    // Call upstream ModelApiService
    const verifyResult = await ModelApiService.verifyCustomerKey(trimmedKey);
    if (!verifyResult.valid) {
      return NextResponse.json(
        { error: verifyResult.error || "API Key không hợp lệ hoặc đã bị vô hiệu hóa" },
        { status: 400 }
      );
    }

    const fingerprint = computeKeyFingerprint(trimmedKey);
    const maskedKey = maskApiKey(trimmedKey);
    const currentQuotaUsd = ModelApiService.quotaToUsd(verifyResult.remainQuota || 0);

    // Get current authenticated user if session exists
    const user = await getAuthenticatedUser(req);
    const currentUserId = user?.userId || null;

    // Check if key is already bound to any record
    const existingBinding = await prisma.customerApiKeyBinding.findFirst({
      where: {
        OR: [
          { keyFingerprint: fingerprint },
          ...(verifyResult.tokenId ? [{ upstreamTokenId: verifyResult.tokenId }] : []),
        ],
      },
    });

    if (existingBinding) {
      // If bound to another registered user -> 409 Conflict
      if (existingBinding.userId && existingBinding.userId !== currentUserId) {
        return NextResponse.json(
          { error: "Key đã được liên kết với một tài khoản khác" },
          { status: 409 }
        );
      }

      // If guest trying to use a key already bound to a registered user -> 409 Conflict
      if (!currentUserId && existingBinding.userId) {
        return NextResponse.json(
          { error: "Key đã được liên kết với một tài khoản khác" },
          { status: 409 }
        );
      }

      // Update existing binding
      const updatedBinding = await prisma.customerApiKeyBinding.update({
        where: { id: existingBinding.id },
        data: {
          maskedKey,
          keyName: verifyResult.name || existingBinding.keyName,
          status: "ACTIVE",
          userId: currentUserId || existingBinding.userId,
          guestEmail: !currentUserId && email ? email.trim() : existingBinding.guestEmail,
          lastSyncedAt: new Date(),
        },
      });

      return NextResponse.json({
        valid: true,
        maskedKey,
        keyName: verifyResult.name || updatedBinding.keyName || "",
        currentQuotaUsd,
        bindingId: updatedBinding.id,
      });
    }

    // Create new customer key binding
    const newBinding = await prisma.customerApiKeyBinding.create({
      data: {
        upstreamTokenId: verifyResult.tokenId || Math.floor(Date.now() % 1000000000),
        keyFingerprint: fingerprint,
        maskedKey,
        keyName: verifyResult.name || null,
        status: "ACTIVE",
        userId: currentUserId,
        guestEmail: !currentUserId && email ? email.trim() : null,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      valid: true,
      maskedKey,
      keyName: verifyResult.name || newBinding.keyName || "",
      currentQuotaUsd,
      bindingId: newBinding.id,
    });
  } catch (err: any) {
    console.error("[POST /api/codex/verify-key Error]:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ nội bộ khi kiểm tra key" },
      { status: 500 }
    );
  }
}
