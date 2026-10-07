import { LocketAutoService } from "./locket-auto.service";
import { LocketPartnerClient, TriggerPassResult } from "./locket-partner.client";

export interface WorkerStatus {
  isRunning: boolean;
  isExecuting: boolean;
  intervalSeconds: number;
  lastTickAt?: Date | null;
  lastStatus?: string | null;
  lastMessage?: string | null;
}

export class LocketAutoWorker {
  private timer: NodeJS.Timeout | null = null;
  private isExecuting = false;
  private lastTickAt: Date | null = null;
  private lastStatus: string | null = null;
  private lastMessage: string | null = null;
  private intervalSeconds: number = 60;

  /**
   * Singleton instance helper with globalThis persistence in dev mode
   */
  static getInstance(): LocketAutoWorker {
    const globalWithWorker = globalThis as typeof globalThis & {
      __locketAutoWorker?: LocketAutoWorker;
    };

    if (!globalWithWorker.__locketAutoWorker) {
      globalWithWorker.__locketAutoWorker = new LocketAutoWorker();
    }

    return globalWithWorker.__locketAutoWorker;
  }

  /**
   * Kiểm tra worker có đang chạy ngầm định kỳ hay không
   */
  public isRunning(): boolean {
    return this.timer !== null;
  }

  /**
   * Lấy trạng thái hiện tại của worker
   */
  public getStatus(): WorkerStatus {
    return {
      isRunning: this.isRunning(),
      isExecuting: this.isExecuting,
      intervalSeconds: this.intervalSeconds,
      lastTickAt: this.lastTickAt,
      lastStatus: this.lastStatus,
      lastMessage: this.lastMessage,
    };
  }

  /**
   * Kích hoạt chạy một lượt (với khóa mutex chống trùng lặp)
   */
  public async executeOnce(): Promise<TriggerPassResult> {
    if (this.isExecuting) {
      return {
        ok: false,
        status: "COOLDOWN",
        message: "Yêu cầu trước đang được xử lý",
        durationMs: 0,
      };
    }

    this.isExecuting = true;

    try {
      const config = await LocketAutoService.getConfig();

      if (!config || !config.passId || !config.signature || !config.sessionCookie) {
        return {
          ok: false,
          status: "FAILED",
          message: "Cấu hình Locket Gold chưa đầy đủ (thiếu passId/signature/cookie)",
          durationMs: 0,
        };
      }

      this.intervalSeconds = config.intervalSeconds || 60;

      const result = await LocketPartnerClient.triggerUsePass({
        passId: config.passId,
        linkVersion: config.linkVersion,
        signature: config.signature,
        cookie: config.sessionCookie,
        csrfToken: config.csrfToken || undefined,
      });

      this.lastTickAt = new Date();
      this.lastStatus = result.status;
      this.lastMessage = result.message;

      await LocketAutoService.recordLog({
        status: result.status,
        jobId: result.jobId,
        message: result.message,
        rawPayload: result.rawPayload,
        durationMs: result.durationMs,
      });

      await LocketAutoService.saveConfig({
        lastRunAt: this.lastTickAt,
        lastStatus: result.status,
        lastMessage: result.message,
        ...(result.status === "SESSION_EXPIRED" ? { isActive: false } : {}),
      });

      if (result.status === "SESSION_EXPIRED") {
        this.stop();
      }

      return result;
    } catch (err: any) {
      const errorResult: TriggerPassResult = {
        ok: false,
        status: "FAILED",
        message: err?.message || "Lỗi thực thi worker",
        durationMs: 0,
      };
      this.lastTickAt = new Date();
      this.lastStatus = errorResult.status;
      this.lastMessage = errorResult.message;
      return errorResult;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Khởi động vòng lặp chạy tự động theo chu kỳ intervalSeconds
   */
  public async start(): Promise<void> {
    if (this.timer) {
      return;
    }

    const config = await LocketAutoService.getConfig();
    this.intervalSeconds = config?.intervalSeconds || 60;

    this.timer = setInterval(() => {
      this.executeOnce().catch((err) => {
        console.error("[LocketAutoWorker] Interval execution failed:", err);
      });
    }, this.intervalSeconds * 1000);

    // Chạy ngay lượt đầu tiên khi bấm khởi động
    await this.executeOnce();
  }

  /**
   * Dừng vòng lặp tự động
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isExecuting = false;
  }
}
