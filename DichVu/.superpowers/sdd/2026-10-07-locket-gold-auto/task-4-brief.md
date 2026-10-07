# Task 4 Brief: Background Worker Engine (LocketAutoWorker)

## Files:
- Create: `src/services/locket-auto/locket-auto.worker.ts`
- Test: `tests/services/locket-auto/locket-auto.worker.test.ts`
- Report: `.superpowers/sdd/2026-10-07-locket-gold-auto/task-4-report.md`

## Interfaces:
```typescript
import { TriggerPassResult } from "./locket-partner.client";

export interface WorkerStatus {
  isRunning: boolean;
  isExecuting: boolean;
  intervalSeconds: number;
  lastTickAt?: Date | null;
  lastStatus?: string | null;
  lastMessage?: string | null;
}

export class LocketAutoWorker {
  static getInstance(): LocketAutoWorker;
  public start(): Promise<void>;
  public stop(): void;
  public isRunning(): boolean;
  public getStatus(): WorkerStatus;
  public executeOnce(): Promise<TriggerPassResult>;
}
```

## Requirements & Implementation Details:
1. **Singleton Instance**:
   - Manage `private static instance: LocketAutoWorker`.
   - In Next.js dev mode, store on `globalThis` (`(globalThis as any).__locketAutoWorker`) to preserve instance across fast-refreshes.
2. **State**:
   - `private timer: NodeJS.Timeout | null = null;`
   - `private isExecuting = false;`
   - `private lastTickAt: Date | null = null;`
   - `private lastStatus: string | null = null;`
   - `private lastMessage: string | null = null;`
3. **`executeOnce()`**:
   - Mutex lock: if `this.isExecuting` is true, return early with `{ ok: false, status: "COOLDOWN", message: "Yêu cầu trước đang được xử lý", durationMs: 0 }`.
   - Set `this.isExecuting = true;`
   - Read config via `LocketAutoService.getConfig()`.
   - If no config or `!config.passId` or `!config.signature` or `!config.sessionCookie`:
     - Set `this.isExecuting = false`.
     - Return `{ ok: false, status: "FAILED", message: "Cấu hình Locket Gold chưa đầy đủ (thiếu passId/signature/cookie)", durationMs: 0 }`.
   - Call `LocketPartnerClient.triggerUsePass({ passId: config.passId, linkVersion: config.linkVersion, signature: config.signature, cookie: config.sessionCookie, csrfToken: config.csrfToken || undefined })`.
   - Update `this.lastTickAt = new Date();`
   - Update `this.lastStatus = result.status;`
   - Update `this.lastMessage = result.message;`
   - Record log via `LocketAutoService.recordLog({ status: result.status, jobId: result.jobId, message: result.message, rawPayload: result.rawPayload, durationMs: result.durationMs })`.
   - Update DB config:
     ```typescript
     await LocketAutoService.saveConfig({
       lastRunAt: this.lastTickAt,
       lastStatus: result.status,
       lastMessage: result.message,
       ...(result.status === "SESSION_EXPIRED" ? { isActive: false } : {})
     });
     ```
   - **Circuit Breaker on `SESSION_EXPIRED`**:
     - If `result.status === "SESSION_EXPIRED"`: call `this.stop();`.
   - In `finally`: `this.isExecuting = false;`.
   - Return `result`.
4. **`start()`**:
   - If `this.timer` exists, return.
   - Read config from DB to get `intervalSeconds` (default 60).
   - Set up `setInterval(async () => { await this.executeOnce(); }, intervalSeconds * 1000)`.
   - Execute first tick immediately or via interval.
5. **`stop()`**:
   - Clear interval `if (this.timer) { clearInterval(this.timer); this.timer = null; }`.
6. **`isRunning()`**:
   - Return `this.timer !== null`.
7. **`getStatus()`**:
   - Return current status object.

## Steps:
1. Write failing tests in `tests/services/locket-auto/locket-auto.worker.test.ts`.
2. Run test to verify it fails (`npx vitest run tests/services/locket-auto/locket-auto.worker.test.ts`).
3. Implement `src/services/locket-auto/locket-auto.worker.ts`.
4. Run test to verify it passes.
5. Commit: `feat(locket-auto): implement LocketAutoWorker engine`.
6. Write report to `.superpowers/sdd/2026-10-07-locket-gold-auto/task-4-report.md`.
