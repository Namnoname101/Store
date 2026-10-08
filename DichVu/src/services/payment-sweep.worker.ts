import { sweepExpiredPaymentIntents } from "./payment-intent.service";

export interface SweepWorkerStatus {
  isRunning: boolean;
  isExecuting: boolean;
  intervalSeconds: number;
  lastTickAt?: Date | null;
  lastSweptCount?: number;
  lastStatus?: "IDLE" | "SUCCESS" | "ERROR";
  lastMessage?: string | null;
}

export interface SweepLogEntry {
  timestamp: string;
  sweptCount: number;
  status: "SUCCESS" | "ERROR";
  message: string;
  durationMs: number;
}

export class PaymentSweepWorker {
  private timer: NodeJS.Timeout | null = null;
  private isExecuting = false;
  private lastTickAt: Date | null = null;
  private lastSweptCount: number = 0;
  private lastStatus: "IDLE" | "SUCCESS" | "ERROR" = "IDLE";
  private lastMessage: string | null = null;
  private intervalSeconds: number = 60;
  private logs: SweepLogEntry[] = [];
  private readonly MAX_LOGS = 100;

  /**
   * Singleton instance helper with globalThis persistence in dev mode
   */
  static getInstance(): PaymentSweepWorker {
    const globalWithWorker = globalThis as typeof globalThis & {
      __paymentSweepWorker?: PaymentSweepWorker;
    };

    if (!globalWithWorker.__paymentSweepWorker) {
      globalWithWorker.__paymentSweepWorker = new PaymentSweepWorker();
    }

    return globalWithWorker.__paymentSweepWorker;
  }

  public isRunning(): boolean {
    return this.timer !== null;
  }

  public getStatus(): SweepWorkerStatus {
    return {
      isRunning: this.isRunning(),
      isExecuting: this.isExecuting,
      intervalSeconds: this.intervalSeconds,
      lastTickAt: this.lastTickAt,
      lastSweptCount: this.lastSweptCount,
      lastStatus: this.lastStatus,
      lastMessage: this.lastMessage,
    };
  }

  public getLogs(): SweepLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Executes a single sweep cycle with concurrency mutex lock
   */
  public async executeOnce(): Promise<{
    success: boolean;
    sweptCount: number;
    skippedConcurrency?: boolean;
    error?: string;
  }> {
    if (this.isExecuting) {
      console.warn("[PaymentSweepWorker] Previous sweep cycle still in progress. Skipping tick.");
      return { success: false, sweptCount: 0, skippedConcurrency: true };
    }

    this.isExecuting = true;
    const startTime = Date.now();
    this.lastTickAt = new Date();

    try {
      const sweptCount = await sweepExpiredPaymentIntents();
      const durationMs = Date.now() - startTime;
      const message = `Quét hết hạn thành công. Đã hủy ${sweptCount} QR intent/đơn quá hạn (${durationMs}ms).`;

      this.lastSweptCount = sweptCount;
      this.lastStatus = "SUCCESS";
      this.lastMessage = message;

      this.recordLog({
        timestamp: new Date().toISOString(),
        sweptCount,
        status: "SUCCESS",
        message,
        durationMs,
      });

      if (sweptCount > 0) {
        console.log(`[PaymentSweepWorker] ${message}`);
      }

      return { success: true, sweptCount };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const errorMsg = error?.message || "Lỗi không xác định khi quét QR hết hạn";

      this.lastStatus = "ERROR";
      this.lastMessage = errorMsg;

      this.recordLog({
        timestamp: new Date().toISOString(),
        sweptCount: 0,
        status: "ERROR",
        message: errorMsg,
        durationMs,
      });

      console.error("[PaymentSweepWorker Error]:", errorMsg);
      return { success: false, sweptCount: 0, error: errorMsg };
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Starts periodic background sweep job
   */
  public start(intervalSeconds = 60): void {
    if (this.timer) {
      this.stop();
    }

    this.intervalSeconds = intervalSeconds;
    console.log(`[PaymentSweepWorker] Started periodic worker every ${intervalSeconds}s`);

    // Immediate initial run
    this.executeOnce().catch(() => {});

    this.timer = setInterval(() => {
      this.executeOnce().catch(() => {});
    }, intervalSeconds * 1000);

    // Unref timer so it does not block Node.js process exit during tests/shutdown
    if (this.timer && typeof this.timer.unref === "function") {
      this.timer.unref();
    }
  }

  /**
   * Stops periodic background sweep job
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[PaymentSweepWorker] Stopped background worker.");
    }
  }

  private recordLog(entry: SweepLogEntry): void {
    this.logs.unshift(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }
  }
}
