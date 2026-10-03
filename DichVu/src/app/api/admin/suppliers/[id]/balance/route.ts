import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupplierAdapter } from "@/services/suppliers/adapter.registry";

interface RouteParams {
  params: {
    id: string;
  } | Promise<{
    id: string;
  }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await Promise.resolve(params);

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const adapter = getSupplierAdapter(supplier.type);
    const balance = await adapter.checkBalance({
      baseUrl: supplier.baseUrl,
      apiKey: supplier.apiKey,
      apiSecret: supplier.apiSecret,
    });

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        currentBalance: Math.round(balance),
      },
    });

    return NextResponse.json(
      { success: true, balance: updated.currentBalance },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to check supplier balance" },
      { status: 500 }
    );
  }
}
