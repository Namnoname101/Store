# Task 3 Brief: Locket Auto Service & Log Store (LocketAutoService)

## Files:
- Create: `src/services/locket-auto/locket-auto.service.ts`
- Test: `tests/services/locket-auto/locket-auto.service.test.ts`
- Report: `.superpowers/sdd/2026-10-07-locket-gold-auto/task-3-report.md`

## Interfaces:
```typescript
import { LocketAutoConfig, LocketAutoLog } from "@prisma/client";

export class LocketAutoService {
  static getConfig(): Promise<LocketAutoConfig | null>;
  static saveConfig(data: {
    goldPassUrl?: string;
    passId?: string;
    linkVersion?: number;
    signature?: string;
    sessionCookie?: string;
    csrfToken?: string | null;
    targetUsername?: string | null;
    isActive?: boolean;
    intervalSeconds?: number;
    lastRunAt?: Date | null;
    lastStatus?: string | null;
    lastMessage?: string | null;
  }): Promise<LocketAutoConfig>;
  static recordLog(data: {
    status: string;
    jobId?: string | null;
    message: string;
    rawPayload?: any;
    durationMs?: number | null;
  }): Promise<LocketAutoLog>;
  static getLogs(limit?: number): Promise<LocketAutoLog[]>;
  static clearLogs(): Promise<void>;
}
```

## Requirements & Implementation Details:
1. `getConfig()`:
   - Queries `prisma.locketAutoConfig.findUnique({ where: { id: "default" } })`.
2. `saveConfig(data)`:
   - Uses `prisma.locketAutoConfig.upsert({ where: { id: "default" }, create: { id: "default", ...sanitizedData }, update: sanitizedData })`.
   - Ensures defaults: `goldPassUrl: data.goldPassUrl || ""`, `passId: data.passId || ""`, `linkVersion: data.linkVersion ?? 1`, `signature: data.signature || ""`, `sessionCookie: data.sessionCookie || ""`, `intervalSeconds: data.intervalSeconds ?? 60`.
3. `recordLog(data)`:
   - Creates a record in `prisma.locketAutoLog`.
   - Serializes `rawPayload` to string if object.
   - Automatically prunes older logs if count > 100:
     - Find logs count or IDs beyond the latest 100, and delete older logs so table doesn't grow indefinitely.
4. `getLogs(limit = 50)`:
   - Returns logs ordered by `createdAt: "desc"`, take `limit`.
5. `clearLogs()`:
   - Deletes all records in `prisma.locketAutoLog.deleteMany()`.

## Steps:
1. Write failing tests in `tests/services/locket-auto/locket-auto.service.test.ts`.
2. Run test to verify it fails (`npx vitest run tests/services/locket-auto/locket-auto.service.test.ts`).
3. Implement `src/services/locket-auto/locket-auto.service.ts`.
4. Run test to verify it passes.
5. Commit: `feat(locket-auto): implement LocketAutoService`.
6. Write report to `.superpowers/sdd/2026-10-07-locket-gold-auto/task-3-report.md`.
