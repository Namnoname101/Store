import { NextRequest, NextResponse } from "next/server";
import { prisma, SupplierType } from "@/lib/prisma";

export async function GET(_request?: NextRequest) {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        mappings: {
          include: {
            product: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ success: true, suppliers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const {
      name,
      code,
      type = SupplierType.CUSTOM_REST,
      baseUrl,
      apiKey,
      apiSecret,
      isActive = true,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Supplier name is required" },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Supplier code is required" },
        { status: 400 }
      );
    }

    if (!baseUrl || typeof baseUrl !== "string" || !baseUrl.trim()) {
      return NextResponse.json(
        { error: "API baseUrl is required" },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return NextResponse.json(
        { error: "API apiKey is required" },
        { status: 400 }
      );
    }

    const formattedCode = code.trim().toUpperCase();

    // Check duplicate code
    const existing = await prisma.supplier.findUnique({
      where: { code: formattedCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Supplier with code "${formattedCode}" already exists` },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        code: formattedCode,
        type: typeof type === "string" ? type.toUpperCase() : SupplierType.CUSTOM_REST,
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret && typeof apiSecret === "string" ? apiSecret.trim() : null,
        isActive: Boolean(isActive),
      },
      include: {
        mappings: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, supplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create supplier" },
      { status: 500 }
    );
  }
}
