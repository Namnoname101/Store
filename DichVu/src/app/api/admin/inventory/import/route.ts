import { NextRequest, NextResponse } from "next/server";
import { importKeysForProduct } from "@/services/bulk-import.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, keys, rawText } = body;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const content = rawText ?? keys;
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Keys content is required" },
        { status: 400 }
      );
    }

    const result = await importKeysForProduct(productId, content);

    return NextResponse.json(
      {
        success: true,
        count: result.count,
        keys: result.keys,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === "Product not found") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    if (error.message === "No valid keys provided") {
      return NextResponse.json(
        { error: "No valid keys provided" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
