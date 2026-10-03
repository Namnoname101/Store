import { NextRequest, NextResponse } from "next/server";
import { prisma, FulfillmentType, MarkupType } from "@/lib/prisma";
import { calculateRetailPrice, syncProductFromSupplier } from "@/services/pricing.service";

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
      id,
      productId,
      supplierId,
      supplierProductCode,
      supplierPrice = 0,
      markupType = MarkupType.PERCENTAGE,
      markupValue = 20,
      isAutoSync = true,
      syncNow = true,
    } = body;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "Sản phẩm (productId) là bắt buộc" },
        { status: 400 }
      );
    }

    if (!supplierId || typeof supplierId !== "string") {
      return NextResponse.json(
        { error: "Nhà cung cấp (supplierId) là bắt buộc" },
        { status: 400 }
      );
    }

    if (!supplierProductCode || typeof supplierProductCode !== "string" || !supplierProductCode.trim()) {
      return NextResponse.json(
        { error: "Mã sản phẩm phía sàn nguồn (supplierProductCode) là bắt buộc" },
        { status: 400 }
      );
    }

    const numericMarkupValue = Number(markupValue);
    const numericSupplierPrice = Math.max(0, Math.round(Number(supplierPrice)));
    const normalizedMarkupType =
      String(markupType).toUpperCase() === MarkupType.FIXED_AMOUNT
        ? MarkupType.FIXED_AMOUNT
        : MarkupType.PERCENTAGE;

    // Check if mapping exists for product
    let mapping;
    if (id) {
      mapping = await prisma.supplierProductMapping.update({
        where: { id },
        data: {
          supplierId,
          supplierProductCode: supplierProductCode.trim(),
          supplierPrice: numericSupplierPrice,
          markupType: normalizedMarkupType,
          markupValue: numericMarkupValue,
          isAutoSync: Boolean(isAutoSync),
        },
        include: {
          product: true,
          supplier: true,
        },
      });
    } else {
      mapping = await prisma.supplierProductMapping.upsert({
        where: { productId },
        create: {
          productId,
          supplierId,
          supplierProductCode: supplierProductCode.trim(),
          supplierPrice: numericSupplierPrice,
          markupType: normalizedMarkupType,
          markupValue: numericMarkupValue,
          isAutoSync: Boolean(isAutoSync),
        },
        update: {
          supplierId,
          supplierProductCode: supplierProductCode.trim(),
          supplierPrice: numericSupplierPrice,
          markupType: normalizedMarkupType,
          markupValue: numericMarkupValue,
          isAutoSync: Boolean(isAutoSync),
        },
        include: {
          product: true,
          supplier: true,
        },
      });
    }

    // Update product fulfillmentType to API_DROPSHIP
    const newRetailPrice = numericSupplierPrice > 0
      ? calculateRetailPrice(numericSupplierPrice, normalizedMarkupType, numericMarkupValue)
      : undefined;

    await prisma.product.update({
      where: { id: productId },
      data: {
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        ...(newRetailPrice ? { price: newRetailPrice } : {}),
      },
    });

    // Optionally sync immediate stock & price if requested
    if (syncNow && mapping.supplier?.isActive) {
      try {
        await syncProductFromSupplier(mapping.id);
      } catch (err: any) {
        console.warn(`Initial sync for mapping ${mapping.id} failed:`, err?.message);
      }
    }

    // Refetch updated mapping
    const finalMapping = await prisma.supplierProductMapping.findUnique({
      where: { id: mapping.id },
      include: {
        product: true,
        supplier: true,
      },
    });

    return NextResponse.json({ success: true, mapping: finalMapping }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save product mapping" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Mapping ID is required" },
        { status: 400 }
      );
    }

    const mapping = await prisma.supplierProductMapping.findUnique({
      where: { id },
      select: { id: true, productId: true },
    });

    if (!mapping) {
      return NextResponse.json(
        { error: "Mapping not found" },
        { status: 404 }
      );
    }

    await prisma.supplierProductMapping.delete({
      where: { id },
    });

    // Revert product fulfillmentType to LOCAL_STOCK
    await prisma.product.update({
      where: { id: mapping.productId },
      data: {
        fulfillmentType: FulfillmentType.LOCAL_STOCK,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete mapping" },
      { status: 500 }
    );
  }
}
