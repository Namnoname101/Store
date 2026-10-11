import { NextRequest, NextResponse } from "next/server";
import { syncAllActiveSuppliers } from "@/services/pricing.service";
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  // 1. Check CRON_SECRET or default internal secret
  const cronSecret = process.env.CRON_SECRET || "internal_sync_secret_token";
  const providedSecret =
    req.headers.get("x-cron-secret") ||
    req.headers.get("x-cron-key") ||
    req.nextUrl.searchParams.get("secret");

  if (providedSecret && providedSecret === cronSecret) {
    return true;
  }

  // 2. Allow local loopback calls from docker background daemon
  const host = req.headers.get("host") || "";
  const forwardedFor = req.headers.get("x-forwarded-for") || "";
  const isLocalHost =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("::1") ||
    req.ip === "127.0.0.1" ||
    req.ip === "::1";

  // If local call and no external x-forwarded-for header from public proxy
  if (isLocalHost && (!forwardedFor || forwardedFor.startsWith("127.0.0.1") || forwardedFor.startsWith("::1"))) {
    return true;
  }

  // 3. Admin session cookie authentication
  const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (adminCookie) {
    return await verifyAdminSessionToken(adminCookie);
  }

  return false;
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: Invalid or missing authorization credentials" },
      { status: 401 }
    );
  }

  const startTime = Date.now();

  try {
    const result = await syncAllActiveSuppliers();
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      durationMs,
      totalMappings: result.totalMappings,
      syncedCount: result.syncedCount,
      pausedCount: result.pausedCount,
      errors: result.errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Internal supplier synchronization error",
      },
      { status: 500 }
    );
  }
}
