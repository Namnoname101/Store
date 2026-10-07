# Commit Log
c1febdc feat(locket-auto): implement LocketAutoWorker engine

# Stat Summary
 DichVu/src/services/locket-auto/locket-auto.worker.ts | 165 +++++++++++++++++
 DichVu/tests/services/locket-auto/locket-auto.worker.test.ts | 206 +++++++++++++++++++++
 2 files changed, 371 insertions(+)

# Diff
diff --git a/DichVu/src/services/locket-auto/locket-auto.worker.ts b/DichVu/src/services/locket-auto/locket-auto.worker.ts
new file mode 100644
index 0000000..f6d8924
--- /dev/null
+++ b/DichVu/src/services/locket-auto/locket-auto.worker.ts
@@ -0,0 +1,165 @@
+import { LocketAutoService } from "./locket-auto.service";
+import { LocketPartnerClient, TriggerPassResult } from "./locket-partner.client";
+
+export interface WorkerStatus {
+  isRunning: boolean;
+  isExecuting: boolean;
+  intervalSeconds: number;
+  lastTickAt?: Date | null;
+  lastStatus?: string | null;
+  lastMessage?: string | null;
+}
+
+export class LocketAutoWorker {
+  private timer: NodeJS.Timeout | null = null;
+  private isExecuting = false;
+  private lastTickAt: Date | null = null;
+  private lastStatus: string | null = null;
+  private lastMessage: string | null = null;
+  private intervalSeconds: number = 60;
+
+  /**
+   * Singleton instance helper with globalThis persistence in dev mode
+   */
+  static getInstance(): LocketAutoWorker {
+    const globalWithWorker = globalThis as typeof globalThis & {
+      __locketAutoWorker?: LocketAutoWorker;
+    };
+
+    if (!globalWithWorker.__locketAutoWorker) {
+      globalWithWorker.__locketAutoWorker = new LocketAutoWorker();
+    }
+
+    return globalWithWorker.__locketAutoWorker;
+  }
+
+  /**
+   * Kiểm tra worker có đang chạy ngầm định kỳ hay không
+   */
+  public isRunning(): boolean {
+    return this.timer !== null;
+  }
+
+  /**
+   * Lấy trạng thái hiện tại của worker
+   */
+  public getStatus(): WorkerStatus {
+    return {
+      isRunning: this.isRunning(),
+      isExecuting: this.isExecuting,
+      intervalSeconds: this.intervalSeconds,
+      lastTickAt: this.lastTickAt,
+      lastStatus: this.lastStatus,
+      lastMessage: this.lastMessage,
+    };
+  }
+
+  /**
+   * Kích hoạt chạy một lượt (với khóa mutex chống trùng lặp)
+   */
+  public async executeOnce(): Promise<TriggerPassResult> {
+    if (this.isExecuting) {
+      return {
+        ok: false,
+        status: "COOLDOWN",
+        message: "Yêu cầu trước đang được xử lý",
+        durationMs: 0,
+      };
+    }
+
+    this.isExecuting = true;
+
+    try {
+      const config = await LocketAutoService.getConfig();
+
+      if (!config || !config.passId || !config.signature || !config.sessionCookie) {
+        return {
+          ok: false,
+          status: "FAILED",
+          message: "Cấu hình Locket Gold chưa đầy đủ (thiếu passId/signature/cookie)",
+          durationMs: 0,
+        };
+      }
+
+      this.intervalSeconds = config.intervalSeconds || 60;
+
+      const result = await LocketPartnerClient.triggerUsePass({
+        passId: config.passId,
+        linkVersion: config.linkVersion,
+        signature: config.signature,
+        cookie: config.sessionCookie,
+        csrfToken: config.csrfToken || undefined,
+      });
+
+      this.lastTickAt = new Date();
+      this.lastStatus = result.status;
+      this.lastMessage = result.message;
+
+      await LocketAutoService.recordLog({
+        status: result.status,
+        jobId: result.jobId,
+        message: result.message,
+        rawPayload: result.rawPayload,
+        durationMs: result.durationMs,
+      });
+
+      await LocketAutoService.saveConfig({
+        lastRunAt: this.lastTickAt,
+        lastStatus: result.status,
+        lastMessage: result.message,
+        ...(result.status === "SESSION_EXPIRED" ? { isActive: false } : {}),
+      });
+
+      if (result.status === "SESSION_EXPIRED") {
+        this.stop();
+      }
+
+      return result;
+    } catch (err: any) {
+      const errorResult: TriggerPassResult = {
+        ok: false,
+        status: "FAILED",
+        message: err?.message || "Lỗi thực thi worker",
+        durationMs: 0,
+      };
+      this.lastTickAt = new Date();
+      this.lastStatus = errorResult.status;
+      this.lastMessage = errorResult.message;
+      return errorResult;
+    } finally {
+      this.isExecuting = false;
+    }
+  }
+
+  /**
+   * Khởi động vòng lặp chạy tự động theo chu kỳ intervalSeconds
+   */
+  public async start(): Promise<void> {
+    if (this.timer) {
+      return;
+    }
+
+    const config = await LocketAutoService.getConfig();
+    this.intervalSeconds = config?.intervalSeconds || 60;
+
+    this.timer = setInterval(() => {
+      this.executeOnce().catch((err) => {
+        console.error("[LocketAutoWorker] Interval execution failed:", err);
+      });
+    }, this.intervalSeconds * 1000);
+
+    // Chạy ngay lượt đầu tiên khi bấm khởi động
+    await this.executeOnce();
+  }
+
+  /**
+   * Dừng vòng lặp tự động
+   */
+  public stop(): void {
+    if (this.timer) {
+      clearInterval(this.timer);
+      this.timer = null;
+    }
+    this.isExecuting = false;
+  }
+}
diff --git a/DichVu/tests/services/locket-auto/locket-auto.worker.test.ts b/DichVu/tests/services/locket-auto/locket-auto.worker.test.ts
new file mode 100644
index 0000000..ba7b567
--- /dev/null
+++ b/DichVu/tests/services/locket-auto/locket-auto.worker.test.ts
@@ -0,0 +1,206 @@
+import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
+import prisma from "@/lib/prisma";
+import { LocketAutoWorker } from "@/services/locket-auto/locket-auto.worker";
+import { LocketAutoService } from "@/services/locket-auto/locket-auto.service";
+import { LocketPartnerClient } from "@/services/locket-auto/locket-partner.client";
+
+describe("LocketAutoWorker", () => {
+  let worker: LocketAutoWorker;
+
+  beforeEach(async () => {
+    vi.useFakeTimers();
+    await prisma.locketAutoLog.deleteMany();
+    await prisma.locketAutoConfig.deleteMany();
+
+    worker = LocketAutoWorker.getInstance();
+    worker.stop();
+  });
+
+  afterEach(() => {
+    worker.stop();
+    vi.clearAllTimers();
+    vi.useRealTimers();
+    vi.restoreAllMocks();
+  });
+
+  it("should provide a singleton instance", () => {
+    const instance1 = LocketAutoWorker.getInstance();
+    const instance2 = LocketAutoWorker.getInstance();
+    expect(instance1).toBe(instance2);
+  });
+
+  it("should fail gracefully if config is missing or credentials are empty", async () => {
+    const result = await worker.executeOnce();
+    expect(result.ok).toBe(false);
+    expect(result.status).toBe("FAILED");
+    expect(result.message).toContain("Cấu hình Locket Gold chưa đầy đủ");
+
+    const status = worker.getStatus();
+    expect(status.isExecuting).toBe(false);
+  });
+
+  it("should execute once successfully when config is valid", async () => {
+    await LocketAutoService.saveConfig({
+      goldPassUrl: "https://example.com/p?p=PASS123&t=SIG123",
+      passId: "PASS123",
+      signature: "SIG123",
+      sessionCookie: "session_val",
+      csrfToken: "csrf_token_1",
+    });
+
+    vi.spyOn(LocketPartnerClient, "triggerUsePass").mockResolvedValue({
+      ok: true,
+      status: "SUCCESS",
+      jobId: "JOB_ABC",
+      message: "Kích hoạt pass thành công",
+      durationMs: 320,
+      rawPayload: { code: 200 },
+    });
+
+    const result = await worker.executeOnce();
+    expect(result.ok).toBe(true);
+    expect(result.status).toBe("SUCCESS");
+    expect(result.jobId).toBe("JOB_ABC");
+
+    // Check worker status
+    const status = worker.getStatus();
+    expect(status.lastStatus).toBe("SUCCESS");
+    expect(status.lastMessage).toBe("Kích hoạt pass thành công");
+    expect(status.lastTickAt).toBeInstanceOf(Date);
+
+    // Check DB log recorded
+    const logs = await LocketAutoService.getLogs();
+    expect(logs.length).toBe(1);
+    expect(logs[0].status).toBe("SUCCESS");
+    expect(logs[0].jobId).toBe("JOB_ABC");
+
+    // Check DB config updated
+    const config = await LocketAutoService.getConfig();
+    expect(config?.lastStatus).toBe("SUCCESS");
+    expect(config?.lastMessage).toBe("Kích hoạt pass thành công");
+  });
+
+  it("should lock concurrent execution and return COOLDOWN if already running", async () => {
+    await LocketAutoService.saveConfig({
+      passId: "PASS123",
+      signature: "SIG123",
+      sessionCookie: "cookie",
+    });
+
+    let resolveTrigger: (value: any) => void;
+    const triggerPromise = new Promise((resolve) => {
+      resolveTrigger = resolve;
+    });
+
+    vi.spyOn(LocketPartnerClient, "triggerUsePass").mockImplementation(() => triggerPromise as any);
+
+    // Start first execution (hanging)
+    const run1 = worker.executeOnce();
+
+    // Start second execution immediately
+    const run2 = await worker.executeOnce();
+    expect(run2.ok).toBe(false);
+    expect(run2.status).toBe("COOLDOWN");
+    expect(run2.message).toContain("đang được xử lý");
+
+    // Resolve first execution
+    resolveTrigger!({
+      ok: true,
+      status: "SUCCESS",
+      message: "Done",
+      durationMs: 100,
+    });
+    await run1;
+
+    expect(worker.getStatus().isExecuting).toBe(false);
+  });
+
+  it("should stop worker and deactivate config when SESSION_EXPIRED occurs (circuit breaker)", async () => {
+    await LocketAutoService.saveConfig({
+      passId: "PASS123",
+      signature: "SIG123",
+      sessionCookie: "expired_cookie",
+      isActive: true,
+    });
+
+    vi.spyOn(LocketPartnerClient, "triggerUsePass")
+      .mockResolvedValueOnce({
+        ok: true,
+        status: "SUCCESS",
+        message: "OK",
+        durationMs: 100,
+      })
+      .mockResolvedValueOnce({
+        ok: false,
+        status: "SESSION_EXPIRED",
+        message: "Phiên đăng nhập đối tác đã hết hạn. Vui lòng cập nhật Cookie mới.",
+        durationMs: 150,
+      });
+
+    // Start worker
+    await worker.start();
+    expect(worker.isRunning()).toBe(true);
+
+    // Execute will trigger SESSION_EXPIRED
+    const result = await worker.executeOnce();
+    expect(result.status).toBe("SESSION_EXPIRED");
+
+    // Circuit breaker should have stopped the worker
+    expect(worker.isRunning()).toBe(false);
+
+    // Config should be deactivated in DB
+    const config = await LocketAutoService.getConfig();
+    expect(config?.isActive).toBe(false);
+    expect(config?.lastStatus).toBe("SESSION_EXPIRED");
+  });
+
+  it("should start and stop timer correctly", async () => {
+    await LocketAutoService.saveConfig({
+      passId: "PASS123",
+      signature: "SIG123",
+      sessionCookie: "cookie",
+      intervalSeconds: 30,
+    });
+
+    const executeSpy = vi.spyOn(worker, "executeOnce").mockResolvedValue({
+      ok: true,
+      status: "SUCCESS",
+      message: "OK",
+      durationMs: 100,
+    });
+
+    expect(worker.isRunning()).toBe(false);
+    await worker.start();
+    expect(worker.isRunning()).toBe(true);
+    // Initial run on start
+    expect(executeSpy).toHaveBeenCalledTimes(1);
+
+    // Advance 30 seconds
+    await vi.advanceTimersByTimeAsync(30000);
+    expect(executeSpy).toHaveBeenCalledTimes(2);
+
+    // Stop worker
+    worker.stop();
+    expect(worker.isRunning()).toBe(false);
+
+    // Advance another 30 seconds, shouldn't trigger
+    await vi.advanceTimersByTimeAsync(30000);
+    expect(executeSpy).toHaveBeenCalledTimes(2);
+  });
+
+  it("should handle unexpected error during trigger gracefully", async () => {
+    await LocketAutoService.saveConfig({
+      passId: "PASS123",
+      signature: "SIG123",
+      sessionCookie: "cookie",
+    });
+
+    vi.spyOn(LocketPartnerClient, "triggerUsePass").mockRejectedValue(new Error("Fatal network crash"));
+
+    const result = await worker.executeOnce();
+    expect(result.ok).toBe(false);
+    expect(result.status).toBe("FAILED");
+    expect(result.message).toBe("Fatal network crash");
+    expect(worker.getStatus().isExecuting).toBe(false);
+  });
+});
