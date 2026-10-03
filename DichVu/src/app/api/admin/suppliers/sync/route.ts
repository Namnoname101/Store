import { NextRequest, NextResponse } from "next/server";
import {
  syncProductFromSupplier,
  syncAllActiveSuppliers,
} from "@/services/pricing.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const mappingId = body?.mappingId;

    if (mappingId && typeof mappingId === "string") {
      const result = await syncProductFromSupplier(mappingId);
      return NextResponse.json({ success: true, result }, { status: 200 });
    }

    const result = await syncAllActiveSuppliers();
    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to sync suppliers" },
      { status: 500 }
    );
  }
}
