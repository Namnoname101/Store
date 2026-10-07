import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import prisma from "@/lib/prisma";
import { LocketAutoWorker } from "@/services/locket-auto/locket-auto.worker";
import { LocketAutoService } from "@/services/locket-auto/locket-auto.service";
import { LocketPartnerClient } from "@/services/locket-auto/locket-partner.client";

describe("LocketAutoWorker", () => {
  let worker: LocketAutoWorker;

  beforeEach(async () => {
    vi.useFakeTimers();
    await prisma.locketAutoLog.deleteMany();
    await prisma.locketAutoConfig.deleteMany();

    worker = LocketAutoWorker.getInstance();
    worker.stop();
  });

  afterEach(() => {
    worker.stop();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should provide a singleton instance", () => {
    const instance1 = LocketAutoWorker.getInstance();
    const instance2 = LocketAutoWorker.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("should fail gracefully if config is missing or credentials are empty", async () => {
    const result = await worker.executeOnce();
    expect(result.ok).toBe(false);
    expect(result.status).toBe("FAILED");
    expect(result.message).toContain("Cấu hình Locket Gold chưa đầy đủ");

    const status = worker.getStatus();
    expect(status.isExecuting).toBe(false);
  });

  it("should execute once successfully when config is valid", async () => {
    await LocketAutoService.saveConfig({
      goldPassUrl: "https://example.com/p?p=PASS123&t=SIG123",
      passId: "PASS123",
      signature: "SIG123",
      sessionCookie: "session_val",
      csrfToken: "csrf_token_1",
    });

    vi.spyOn(LocketPartnerClient, "triggerUsePass").mockResolvedValue({
      ok: true,
      status: "SUCCESS",
      jobId: "JOB_ABC",
      message: "Kích hoạt pass thành công",
      durationMs: 320,
      rawPayload: { code: 200 },
    });

    const result = await worker.executeOnce();
    expect(result.ok).toBe(true);
    expect(result.status).toBe("SUCCESS");
    expect(result.jobId).toBe("JOB_ABC");

    // Check worker status
    const status = worker.getStatus();
    expect(status.lastStatus).toBe("SUCCESS");
    expect(status.lastMessage).toBe("Kích hoạt pass thành công");
    expect(status.lastTickAt).toBeInstanceOf(Date);

    // Check DB log recorded
    const logs = await LocketAutoService.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("SUCCESS");
    expect(logs[0].jobId).toBe("JOB_ABC");

    // Check DB config updated
    const config = await LocketAutoService.getConfig();
    expect(config?.lastStatus).toBe("SUCCESS");
    expect(config?.lastMessage).toBe("Kích hoạt pass thành công");
  });

  it("should lock concurrent execution and return COOLDOWN if already running", async () => {
    await LocketAutoService.saveConfig({
      passId: "PASS123",
      signature: "SIG123",
      sessionCookie: "cookie",
    });

    let resolveTrigger: (value: any) => void;
    const triggerPromise = new Promise((resolve) => {
      resolveTrigger = resolve;
    });

    vi.spyOn(LocketPartnerClient, "triggerUsePass").mockImplementation(() => triggerPromise as any);

    // Start first execution (hanging)
    const run1 = worker.executeOnce();

    // Start second execution immediately
    const run2 = await worker.executeOnce();
    expect(run2.ok).toBe(false);
    expect(run2.status).toBe("COOLDOWN");
    expect(run2.message).toContain("đang được xử lý");

    // Resolve first execution
    resolveTrigger!({
      ok: true,
      status: "SUCCESS",
      message: "Done",
      durationMs: 100,
    });
    await run1;

    expect(worker.getStatus().isExecuting).toBe(false);
  });

  it("should stop worker and deactivate config when SESSION_EXPIRED occurs (circuit breaker)", async () => {
    await LocketAutoService.saveConfig({
      passId: "PASS123",
      signature: "SIG123",
      sessionCookie: "expired_cookie",
      isActive: true,
    });

    vi.spyOn(LocketPartnerClient, "triggerUsePass")
      .mockResolvedValueOnce({
        ok: true,
        status: "SUCCESS",
        message: "OK",
        durationMs: 100,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: "SESSION_EXPIRED",
        message: "Phiên đăng nhập đối tác đã hết hạn. Vui lòng cập nhật Cookie mới.",
        durationMs: 150,
      });

    // Start worker
    await worker.start();
    expect(worker.isRunning()).toBe(true);

    // Execute will trigger SESSION_EXPIRED
    const result = await worker.executeOnce();
    expect(result.status).toBe("SESSION_EXPIRED");

    // Circuit breaker should have stopped the worker
    expect(worker.isRunning()).toBe(false);

    // Config should be deactivated in DB
    const config = await LocketAutoService.getConfig();
    expect(config?.isActive).toBe(false);
    expect(config?.lastStatus).toBe("SESSION_EXPIRED");
  });

  it("should start and stop timer correctly", async () => {
    await LocketAutoService.saveConfig({
      passId: "PASS123",
      signature: "SIG123",
      sessionCookie: "cookie",
      intervalSeconds: 30,
    });

    const executeSpy = vi.spyOn(worker, "executeOnce").mockResolvedValue({
      ok: true,
      status: "SUCCESS",
      message: "OK",
      durationMs: 100,
    });

    expect(worker.isRunning()).toBe(false);
    await worker.start();
    expect(worker.isRunning()).toBe(true);
    // Initial run on start
    expect(executeSpy).toHaveBeenCalledTimes(1);

    // Advance 30 seconds
    await vi.advanceTimersByTimeAsync(30000);
    expect(executeSpy).toHaveBeenCalledTimes(2);

    // Stop worker
    worker.stop();
    expect(worker.isRunning()).toBe(false);

    // Advance another 30 seconds, shouldn't trigger
    await vi.advanceTimersByTimeAsync(30000);
    expect(executeSpy).toHaveBeenCalledTimes(2);
  });

  it("should handle unexpected error during trigger gracefully", async () => {
    await LocketAutoService.saveConfig({
      passId: "PASS123",
      signature: "SIG123",
      sessionCookie: "cookie",
    });

    vi.spyOn(LocketPartnerClient, "triggerUsePass").mockRejectedValue(new Error("Fatal network crash"));

    const result = await worker.executeOnce();
    expect(result.ok).toBe(false);
    expect(result.status).toBe("FAILED");
    expect(result.message).toBe("Fatal network crash");
    expect(worker.getStatus().isExecuting).toBe(false);
  });
});
