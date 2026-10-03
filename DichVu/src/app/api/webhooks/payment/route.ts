import { NextResponse } from "next/server";
import {
  handleIncomingTransaction,
  normalizeTransactionPayload,
} from "@/services/payment.service";

export async function GET() {
  return NextResponse.json(
    { success: true, message: "Payment webhook endpoint is active" },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  // 1. Webhook Secret Authentication Check (if configured and not placeholder)
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  const isSecretConfigured =
    webhookSecret &&
    webhookSecret.trim() !== "" &&
    webhookSecret !== "secret_token_here" &&
    webhookSecret !== "your_secret_token_here";

  if (isSecretConfigured) {
    const url = new URL(request.url);
    const headerSecret =
      request.headers.get("x-webhook-secret") ||
      request.headers.get("x-api-key");
    const authHeader = request.headers.get("authorization");
    let authSecret: string | null = null;

    if (authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        authSecret = authHeader.slice(7).trim();
      } else if (authHeader.startsWith("Apikey ")) {
        authSecret = authHeader.slice(7).trim();
      } else {
        authSecret = authHeader.trim();
      }
    }

    const querySecret =
      url.searchParams.get("token") || url.searchParams.get("secret");

    const providedSecret = headerSecret || authSecret || querySecret;

    if (!providedSecret || providedSecret !== webhookSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid webhook secret" },
        { status: 401 }
      );
    }
  }

  // 2. Flexible Body parsing (JSON or Form Data)
  let body: any;
  const contentType = request.headers.get("content-type") || "";

  try {
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await request.json();
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  console.log("[Webhook Received Body]:", JSON.stringify(body));

  // 3. Normalization & validation
  const normalizedPayload = normalizeTransactionPayload(body);
  if (!normalizedPayload) {
    return NextResponse.json(
      {
        error:
          "Malformed payload: transactionId and positive amount are required",
      },
      { status: 400 }
    );
  }

  // 4. Process transaction
  try {
    const result = await handleIncomingTransaction(normalizedPayload);

    if (result.error?.includes("Invalid transaction payload")) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Always respond with HTTP 200 and success: true for gateways
    return NextResponse.json(
      {
        success: true,
        orderCode: result.orderCode,
        status: result.status,
        isDuplicate: result.isDuplicate,
        message: result.message || (result.success ? "Processed" : result.error),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Webhook Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
