import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  } | Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
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
      include: {
        mappings: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, supplier }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await Promise.resolve(params);

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

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
      type,
      baseUrl,
      apiKey,
      apiSecret,
      isActive,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (code !== undefined) updateData.code = String(code).trim().toUpperCase();
    if (type !== undefined) updateData.type = String(type).trim().toUpperCase();
    if (baseUrl !== undefined) updateData.baseUrl = String(baseUrl).trim();
    if (apiKey !== undefined) updateData.apiKey = String(apiKey).trim();
    if (apiSecret !== undefined) {
      updateData.apiSecret = apiSecret ? String(apiSecret).trim() : null;
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.supplier.update({
      where: { id },
      data: updateData,
      include: {
        mappings: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, supplier: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update supplier" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return PUT(request, { params });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await Promise.resolve(params);

    if (!id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
