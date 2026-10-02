import { NextResponse } from "next/server";
import {
  handleIncomingTransaction,
  normalizeTransactionPayload,
} from "@/services/payment.service";

export async function POST(request: Request) {
  // 1. Webhook Secret Authentication Check (if configured)
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (webhookSecret) {
    const url = new URL(request.url);
    const headerSecret = request.headers.get("x-webhook-secret");
    const authHeader = request.headers.get("authorization");
    const bearerSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;
    const querySecret =
      url.searchParams.get("token") || url.searchParams.get("secret");

    const providedSecret = headerSecret || bearerSecret || querySecret;

    if (!providedSecret || providedSecret !== webhookSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid webhook secret" },
        { status: 401 }
      );
    }
  }

  // 2. Body parsing
  let body: any;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // 3. Normalization & validation
  const normalizedPayload = normalizeTransactionPayload(body);
  if (!normalizedPayload) {
    return NextResponse.json(
      {
        error:
          "Malformed payload: transactionId, positive amount, and content are required",
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

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
