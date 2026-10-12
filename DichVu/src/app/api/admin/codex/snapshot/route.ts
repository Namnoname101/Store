import { NextRequest, NextResponse } from "next/server";
import prisma, { SyncSnapshotStatus } from "@/lib/prisma";
import { ModelApiService } from "@/services/modelapi/modelapi.service";

async function computeAndSaveSnapshot() {
  const sourceBalance = await ModelApiService.fetchSourceBalance();

  // Sum total customer obligation quota
  const activeBindings = await prisma.customerApiKeyBinding.findMany({
    where: { status: "ACTIVE" },
  });

  // Calculate total credit topped up converted to quota
  const totalCustomerObligationQuota = activeBindings.reduce(
    (sum, b) => sum + ModelApiService.usdToQuota(b.totalCreditUsd),
    0
  );

  const sourceQuotaTotal = Number(sourceBalance.quota || 0);
  const sourceQuotaUsed = Number(sourceBalance.usedQuota || 0);
  const sourceBalanceUsd = Number(sourceBalance.balanceUsd || 0);

  // Status calculation
  let status: string = SyncSnapshotStatus.HEALTHY;
  if (totalCustomerObligationQuota > 0) {
    const ratio = sourceQuotaTotal / totalCustomerObligationQuota;
    if (ratio < 1.0) {
      status = SyncSnapshotStatus.CRITICAL;
    } else if (ratio < 1.2) {
      status = SyncSnapshotStatus.WARNING_LOW_BALANCE;
    }
  }

  const snapshot = await prisma.modelApiSyncSnapshot.create({
    data: {
      sourceQuotaTotal,
      sourceQuotaUsed,
      sourceBalanceUsd,
      totalCustomerObligationQuota,
      status,
    },
  });

  return snapshot;
}

export async function GET(_req: NextRequest) {
  try {
    let latest = await prisma.modelApiSyncSnapshot.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      latest = await computeAndSaveSnapshot();
    }

    return NextResponse.json({
      success: true,
      snapshot: latest,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/codex/snapshot Error]:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tải snapshot ModelAPI" },
      { status: 500 }
    );
  }
}

export async function POST(_req: NextRequest) {
  try {
    const snapshot = await computeAndSaveSnapshot();
    return NextResponse.json({
      success: true,
      snapshot,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/codex/snapshot Error]:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật snapshot ModelAPI" },
      { status: 500 }
    );
  }
}
