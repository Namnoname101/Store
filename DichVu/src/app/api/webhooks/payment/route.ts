import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  handleIncomingTransaction,
  normalizeTransactionPayload,
} from "@/services/payment.service";

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyPayOsSignature(data: any, signature: string, checksumKey: string): boolean {
  if (!data || typeof data !== "object" || !signature || !checksumKey) return false;
  try {
    const sortedKeys = Object.keys(data).sort();
    const signData = sortedKeys
      .map((key) => {
        const val = data[key];
        const strVal = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
        return `${key}=${strVal}`;
      })
      .join("&");
    const calculatedSignature = crypto.createHmac("sha256", checksumKey).update(signData).digest("hex");
    return timingSafeEqualStr(calculatedSignature.toLowerCase(), signature.toLowerCase());
  } catch {
    return false;
  }
}

export async function GET() {
  return NextResponse.json(
    { success: true, message: "Payment webhook endpoint is active" },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  // 1. Flexible Body parsing (JSON or Form Data)
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

  // 2. Authentication Check (SePay Apikey / Header Secret / PayOS HMAC Checksum)
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.PAYOS_CHECKSUM_KEY;
  const isSecretConfigured =
    webhookSecret &&
    webhookSecret.trim() !== "" &&
    webhookSecret !== "secret_token_here" &&
    webhookSecret !== "your_secret_token_here";

  if (process.env.NODE_ENV === "production" && !isSecretConfigured) {
    console.error("[CRITICAL SECURITY] PAYMENT_WEBHOOK_SECRET is missing or default in production!");
    return NextResponse.json(
      { error: "Server security misconfiguration: Webhook secret required in production" },
      { status: 500 }
    );
  }

  if (isSecretConfigured) {
    let isAuthenticated = false;

    // A. Check Header / Query Token (SePay / Custom gateway)
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

    if (providedSecret && timingSafeEqualStr(providedSecret, webhookSecret)) {
      isAuthenticated = true;
    }

    // B. Check PayOS HMAC-SHA256 signature if body.signature is present
    if (!isAuthenticated && body && typeof body === "object" && body.signature && body.data) {
      const payosKey = process.env.PAYOS_CHECKSUM_KEY || webhookSecret;
      if (verifyPayOsSignature(body.data, body.signature, payosKey)) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid webhook secret or signature" },
        { status: 401 }
      );
    }
  }

  // 3. Sanitize logging (avoid printing raw auth secrets/passwords)
  const safeLog = body && typeof body === "object"
    ? {
        transactionId: (body as any).transactionId || (body as any).id || (body as any).trans_id || "[MASKED]",
        amount: (body as any).amount,
        content: (body as any).content || (body as any).description,
        bankCode: (body as any).bankCode || (body as any).gateway,
      }
    : "[NON-OBJECT]";
  console.log("[Webhook Received]:", JSON.stringify(safeLog));

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
