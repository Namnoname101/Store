# Commit Log
552010d feat(locket-auto): implement admin API endpoints

# Stat Summary
 DichVu/src/app/api/admin/locket-auto/config/route.ts          |  99 +++++++++++++++++++
 DichVu/src/app/api/admin/locket-auto/logs/route.ts            |  60 ++++++++++++
 DichVu/src/app/api/admin/locket-auto/test-connection/route.ts |  75 +++++++++++++++
 DichVu/src/app/api/admin/locket-auto/trigger-now/route.ts     |  36 +++++++
 DichVu/src/lib/admin-auth.ts                                  |  25 +++++
 DichVu/tests/api/admin-locket-auto.test.ts                   | 187 ++++++++++++++++++++++++++++++++++++
 6 files changed, 482 insertions(+)

# Diff
diff --git a/DichVu/src/app/api/admin/locket-auto/config/route.ts b/DichVu/src/app/api/admin/locket-auto/config/route.ts
new file mode 100644
index 0000000..f6a0a03
--- /dev/null
+++ b/DichVu/src/app/api/admin/locket-auto/config/route.ts
@@ -0,0 +1,99 @@
+import { NextRequest, NextResponse } from "next/server";
+import { requireAdminAuth } from "@/lib/admin-auth";
+import { LocketAutoService, SaveConfigData } from "@/services/locket-auto/locket-auto.service";
+import { LocketAutoWorker } from "@/services/locket-auto/locket-auto.worker";
+import { LocketPartnerClient } from "@/services/locket-auto/locket-partner.client";
+
+export const dynamic = "force-dynamic";
+
+export async function GET(req: NextRequest) {
+  try {
+    const admin = await requireAdminAuth(req);
+    if (!admin) {
+      return NextResponse.json(
+        { ok: false, error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
+        { status: 401 }
+      );
+    }
+
+    const config = await LocketAutoService.getConfig();
+    const worker = LocketAutoWorker.getInstance();
+
+    // Tự động khôi phục nhịp worker nếu cấu hình đang bật isActive mà worker chưa chạy
+    if (config?.isActive && !worker.isRunning()) {
+      worker.start().catch((err) => {
+        console.error("[LocketAutoWorker] Background auto-start failed:", err);
+      });
+    }
+
+    return NextResponse.json({
+      ok: true,
+      config,
+      workerStatus: worker.getStatus(),
+    });
+  } catch (err: any) {
+    return NextResponse.json(
+      { ok: false, error: err?.message || "Lỗi lấy cấu hình Locket Auto" },
+      { status: 500 }
+    );
+  }
+}
+
+export async function POST(req: NextRequest) {
+  try {
+    const admin = await requireAdminAuth(req);
+    if (!admin) {
+      return NextResponse.json(
+        { ok: false, error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
+        { status: 401 }
+      );
+    }
+
+    const body = await req.json();
+    const savePayload: SaveConfigData = {};
+
+    if (body.goldPassUrl !== undefined) {
+      savePayload.goldPassUrl = body.goldPassUrl;
+      if (body.goldPassUrl && body.goldPassUrl.trim() !== "") {
+        try {
+          const parsed = LocketPartnerClient.parseUrl(body.goldPassUrl);
+          savePayload.passId = parsed.passId;
+          savePayload.linkVersion = parsed.linkVersion;
+          savePayload.signature = parsed.signature;
+        } catch (parseErr: any) {
+          return NextResponse.json(
+            { ok: false, error: parseErr?.message || "URL GoldPass không hợp lệ" },
+            { status: 400 }
+          );
+        }
+      }
+    }
+
+    if (body.passId !== undefined) savePayload.passId = body.passId;
+    if (body.linkVersion !== undefined) savePayload.linkVersion = body.linkVersion;
+    if (body.signature !== undefined) savePayload.signature = body.signature;
+    if (body.sessionCookie !== undefined) savePayload.sessionCookie = body.sessionCookie;
+    if (body.csrfToken !== undefined) savePayload.csrfToken = body.csrfToken;
+    if (body.targetUsername !== undefined) savePayload.targetUsername = body.targetUsername;
+    if (body.isActive !== undefined) savePayload.isActive = body.isActive;
+    if (body.intervalSeconds !== undefined) savePayload.intervalSeconds = Number(body.intervalSeconds);
+
+    const saved = await LocketAutoService.saveConfig(savePayload);
+    const worker = LocketAutoWorker.getInstance();
+
+    if (saved.isActive) {
+      await worker.start();
+    } else {
+      worker.stop();
+    }
+
+    return NextResponse.json({
+      ok: true,
+      config: saved,
+      workerStatus: worker.getStatus(),
+    });
+  } catch (err: any) {
+    return NextResponse.json(
+      { ok: false, error: err?.message || "Lỗi lưu cấu hình Locket Auto" },
+      { status: 500 }
+    );
+  }
+}
diff --git a/DichVu/src/app/api/admin/locket-auto/logs/route.ts b/DichVu/src/app/api/admin/locket-auto/logs/route.ts
new file mode 100644
index 0000000..f6f6eb8
--- /dev/null
+++ b/DichVu/src/app/api/admin/locket-auto/logs/route.ts
@@ -0,0 +1,60 @@
+import { NextRequest, NextResponse } from "next/server";
+import { requireAdminAuth } from "@/lib/admin-auth";
+import { LocketAutoService } from "@/services/locket-auto/locket-auto.service";
+
+export const dynamic = "force-dynamic";
+
+export async function GET(req: NextRequest) {
+  try {
+    const admin = await requireAdminAuth(req);
+    if (!admin) {
+      return NextResponse.json(
+        { ok: false, error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
+        { status: 401 }
+      );
+    }
+
+    const searchParams = req.nextUrl.searchParams;
+    const limitParam = searchParams.get("limit");
+    const limit = limitParam ? parseInt(limitParam, 10) : 50;
+
+    const logs = await LocketAutoService.getLogs(Number.isNaN(limit) ? 50 : limit);
+
+    return NextResponse.json({
+      ok: true,
+      logs,
+    });
+  } catch (err: any) {
+    return NextResponse.json(
+      { ok: false, error: err?.message || "Lỗi lấy nhật ký Locket Auto" },
+      { status: 500 }
+    );
+  }
+}
+
+export async function DELETE(req: NextRequest) {
+  try {
+    const admin = await requireAdminAuth(req);
+    if (!admin) {
+      return NextResponse.json(
+        { ok: false, error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
+        { status: 401 }
+      );
+    }
+
+    await LocketAutoService.clearLogs();
+
+    return NextResponse.json({
+      ok: true,
+      message: "Đã xóa toàn bộ nhật ký thực thi",
+    });
+  } catch (err: any) {
+    return NextResponse.json(
+      { ok: false, error: err?.message || "Lỗi xóa nhật ký Locket Auto" },
+      { status: 500 }
+    );
+  }
+}
diff --git a/DichVu/src/app/api/admin/locket-auto/test-connection/route.ts b/DichVu/src/app/api/admin/locket-auto/test-connection/route.ts
new file mode 100644
index 0000000..f581eb0
--- /dev/null
+++ b/DichVu/src/app/api/admin/locket-auto/test-connection/route.ts
@@ -0,0 +1,75 @@
+import { NextRequest, NextResponse } from "next/server";
+import { requireAdminAuth } from "@/lib/admin-auth";
+import { LocketAutoService } from "@/services/locket-auto/locket-auto.service";
+import { LocketPartnerClient } from "@/services/locket-auto/locket-partner.client";
+
+export const dynamic = "force-dynamic";
+
+export async function POST(req: NextRequest) {
+  try {
+    const admin = await requireAdminAuth(req);
+    if (!admin) {
+      return NextResponse.json(
+        { ok: false, error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
+        { status: 401 }
+      );
+    }
+
+    const body = await req.json().catch(() => ({}));
+    const currentConfig = await LocketAutoService.getConfig();
+
+    let passId = body.passId || currentConfig?.passId;
+    let linkVersion = body.linkVersion || currentConfig?.linkVersion || 1;
+    let signature = body.signature || currentConfig?.signature;
+    const cookie = body.sessionCookie || currentConfig?.sessionCookie;
+
+    if (body.goldPassUrl && body.goldPassUrl.trim() !== "") {
+      try {
+        const parsed = LocketPartnerClient.parseUrl(body.goldPassUrl);
+        passId = parsed.passId;
+        linkVersion = parsed.linkVersion;
+        signature = parsed.signature;
+      } catch (parseErr: any) {
+        return NextResponse.json(
+          { ok: false, error: parseErr?.message || "URL GoldPass không hợp lệ" },
+          { status: 400 }
+        );
+      }
+    }
+
+    if (!passId || !signature || !cookie) {
+      return NextResponse.json(
+        {
+          ok: false,
+          error: "Vui lòng cung cấp link GoldPass và Session Cookie để kiểm tra kết nối.",
+        },
+        { status: 400 }
+      );
+    }
+
+    const result = await LocketPartnerClient.testAccess({
+      passId,
+      linkVersion,
+      signature,
+      cookie,
+    });
+
+    if (result.ok && result.targetUsername) {
+      await LocketAutoService.saveConfig({
+        targetUsername: result.targetUsername,
+      });
+    }
+
+    return NextResponse.json({
+      ok: result.ok,
+      targetUsername: result.targetUsername,
+      statusLabel: result.statusLabel,
+      cooldownRemaining: result.cooldownRemaining,
+      error: result.error,
+      rawPayload: result.rawPayload,
+    });
+  } catch (err: any) {
+    return NextResponse.json(
+      { ok: false, error: err?.message || "Lỗi kiểm tra kết nối đối tác" },
+      { status: 500 }
+    );
+  }
+}
diff --git a/DichVu/src/app/api/admin/locket-auto/trigger-now/route.ts b/DichVu/src/app/api/admin/locket-auto/trigger-now/route.ts
new file mode 100644
index 0000000..742bb95
--- /dev/null
+++ b/DichVu/src/app/api/admin/locket-auto/trigger-now/route.ts
@@ -0,0 +1,36 @@
+import { NextRequest, NextResponse } from "next/server";
+import { requireAdminAuth } from "@/lib/admin-auth";
+import { LocketAutoWorker } from "@/services/locket-auto/locket-auto.worker";
+
+export const dynamic = "force-dynamic";
+
+export async function POST(req: NextRequest) {
+  try {
+    const admin = await requireAdminAuth(req);
+    if (!admin) {
+      return NextResponse.json(
+        { ok: false, error: "Unauthorized: Vui lòng đăng nhập quyền quản trị" },
+        { status: 401 }
+      );
+    }
+
+    const worker = LocketAutoWorker.getInstance();
+    const result = await worker.executeOnce();
+
+    return NextResponse.json({
+      ok: result.ok,
+      status: result.status,
+      jobId: result.jobId,
+      message: result.message,
+      durationMs: result.durationMs,
+      rawPayload: result.rawPayload,
+      workerStatus: worker.getStatus(),
+    });
+  } catch (err: any) {
+    return NextResponse.json(
+      { ok: false, error: err?.message || "Lỗi kích hoạt ngay" },
+      { status: 500 }
+    );
+  }
+}
