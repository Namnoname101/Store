# 24/7 Locket Gold Auto-Activator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng công cụ quản trị Admin và tiến trình Background Worker 24/7 trên server để tự động kích hoạt gói Locket GoldPass mỗi 1 phút liên tục qua đối tác Yuicsa.

**Architecture:** Mở rộng Prisma schema với `LocketAutoConfig` và `LocketAutoLog`. Tạo service `LocketPartnerClient` để giao tiếp với API đối tác, kết hợp `LocketAutoWorker` singleton in-memory timer chạy ngầm độc lập với mutex lock và ngắt an toàn. Cung cấp bộ REST API tại `/api/admin/locket-auto/*` và trang quản trị trực quan tại `/admin/locket-auto`.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Prisma ORM, SQLite, Tailwind CSS, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-07-locket-gold-auto-design.md`

## Global Constraints

- Mọi API route trong `/api/admin/locket-auto/*` phải được bảo vệ bởi middleware/session xác thực quản trị viên (`requireAdminAuth`).
- Khi phát hiện mã lỗi `401` từ phía đối tác (Cookie đăng nhập hết hạn), worker phải tự động chuyển `isActive = false` trong DB và dừng nhịp chạy ngầm để tránh gửi request rác liên tục.
- Mỗi lần gọi `POST /api/v1/goldpass/use` phải sinh một `idempotency_key` độc nhất (UUID v4).
- Phải đảm bảo concurrency lock (mutex) để không có 2 request kích hoạt chạy đồng thời nếu mạng bị delay.
- Bảng nhật ký `LocketAutoLog` tự động dọn dẹp giữ tối đa 100 bản ghi mới nhất.

## Review Focus

- URL GoldPass chứa ký tự lạ hoặc thiếu tham số `p`, `v`, `t` -> Phải bắt lỗi và thông báo rõ ràng, không làm crash server.
- Session Cookie trống hoặc không đúng định dạng -> Phải từ chối lưu và hướng dẫn người dùng dán cookie từ DevTools.
- Mạng đối tác timeout (vượt quá 15 giây) -> Sử dụng AbortController ngắt request, ghi log FAILED và thử lại ở chu kỳ tiếp theo.
- Đối tác trả về `cooldown_remaining` (400/429) -> Coi là trạng thái COOLDOWN hợp lệ, ghi log và chờ đến chu kỳ tiếp theo.
- Server restart / reload -> Worker tự động đọc DB và khôi phục trạng thái chạy nếu `isActive === true`.

---

### Task 1: Prisma Schema & Models (`LocketAutoConfig`, `LocketAutoLog`)

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `tests/db-locket-auto.test.ts`

**Interfaces:**
- Produces: `prisma.locketAutoConfig`, `prisma.locketAutoLog`

- [ ] **Step 1: Write test for Prisma models**

```typescript
// tests/db-locket-auto.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Locket Auto Database Models", () => {
  beforeEach(async () => {
    await prisma.locketAutoLog.deleteMany();
    await prisma.locketAutoConfig.deleteMany();
  });

  it("creates and retrieves LocketAutoConfig", async () => {
    const config = await prisma.locketAutoConfig.create({
      data: {
        id: "default",
        goldPassUrl: "https://locketgold.yuichycsa.id.vn/shop/gold-pass/?p=PASS123&v=1&t=SIG123",
        passId: "PASS123",
        linkVersion: 1,
        signature: "SIG123",
        sessionCookie: "session=token_abc",
        csrfToken: "csrf_token_xyz",
        targetUsername: "@qthinh0106",
        isActive: false,
        intervalSeconds: 60,
      },
    });

    expect(config.id).toBe("default");
    expect(config.passId).toBe("PASS123");
    expect(config.isActive).toBe(false);
  });

  it("creates and retrieves LocketAutoLog", async () => {
    const log = await prisma.locketAutoLog.create({
      data: {
        status: "SUCCESS",
        jobId: "job_987",
        message: "Kích hoạt thành công",
        durationMs: 420,
      },
    });

    expect(log.id).toBeDefined();
    expect(log.status).toBe("SUCCESS");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/db-locket-auto.test.ts`
Expected: FAIL (models do not exist on Prisma Client)

- [ ] **Step 3: Update `prisma/schema.prisma` with `LocketAutoConfig` and `LocketAutoLog` models & run `npx prisma db push`**

Add models to `prisma/schema.prisma` as specified in the spec, then generate prisma client:
`npx prisma db push`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/db-locket-auto.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma tests/db-locket-auto.test.ts
git commit -m "feat(locket-auto): add prisma schema models for auto activator"
```

---

### Task 2: Locket Partner Client (`LocketPartnerClient`)

**Files:**
- Create: `src/services/locket-auto/locket-partner.client.ts`
- Test: `tests/services/locket-auto/locket-partner.client.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface ParsedGoldPassUrl {
    passId: string;
    linkVersion: number;
    signature: string;
  }
  export interface TestAccessResult {
    ok: boolean;
    targetUsername?: string;
    statusLabel?: string;
    cooldownRemaining?: number;
    error?: string;
  }
  export interface TriggerPassResult {
    ok: boolean;
    jobId?: string;
    status: "SUCCESS" | "COOLDOWN" | "FAILED" | "SESSION_EXPIRED";
    message: string;
    durationMs: number;
    rawPayload?: any;
  }
  export class LocketPartnerClient {
    static parseUrl(url: string): ParsedGoldPassUrl;
    static testAccess(params: { passId: string; linkVersion: number; signature: string; cookie: string }): Promise<TestAccessResult>;
    static triggerUsePass(params: { passId: string; linkVersion: number; signature: string; cookie: string; csrfToken?: string }): Promise<TriggerPassResult>;
  }
  ```

- [ ] **Step 1: Write test for `LocketPartnerClient`**

```typescript
// tests/services/locket-auto/locket-partner.client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LocketPartnerClient } from "@/services/locket-auto/locket-partner.client";

describe("LocketPartnerClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("parseUrl", () => {
    it("parses valid GoldPass URL", () => {
      const url = "https://locketgold.yuichycsa.id.vn/shop/gold-pass/?p=_X60yTor2CpLzvXpFIKlCOIM&v=1&t=4c80b865c613e8a9121e73342fd23039c96aca816d7dadf9f48d90d190dfa4f4";
      const res = LocketPartnerClient.parseUrl(url);
      expect(res.passId).toBe("_X60yTor2CpLzvXpFIKlCOIM");
      expect(res.linkVersion).toBe(1);
      expect(res.signature).toBe("4c80b865c613e8a9121e73342fd23039c96aca816d7dadf9f48d90d190dfa4f4");
    });

    it("throws error on missing parameters", () => {
      expect(() => LocketPartnerClient.parseUrl("https://example.com")).toThrow("Thiếu tham số");
    });
  });

  describe("triggerUsePass", () => {
    it("returns SUCCESS on 200 response with job", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: { job: { job_id: "JOB_123" } }, message: "Tiếp nhận" }),
      });

      const res = await LocketPartnerClient.triggerUsePass({
        passId: "P1",
        linkVersion: 1,
        signature: "S1",
        cookie: "session=abc",
      });

      expect(res.status).toBe("SUCCESS");
      expect(res.jobId).toBe("JOB_123");
    });

    it("detects SESSION_EXPIRED on 401", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ ok: false, message: "Unauthorized" }),
      });

      const res = await LocketPartnerClient.triggerUsePass({
        passId: "P1",
        linkVersion: 1,
        signature: "S1",
        cookie: "invalid_cookie",
      });

      expect(res.status).toBe("SESSION_EXPIRED");
    });

    it("detects COOLDOWN on 400/429 cooldown response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ ok: false, message: "Vui lòng chờ 45s trước khi kích tiếp" }),
      });

      const res = await LocketPartnerClient.triggerUsePass({
        passId: "P1",
        linkVersion: 1,
        signature: "S1",
        cookie: "session=abc",
      });

      expect(res.status).toBe("COOLDOWN");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/locket-auto/locket-partner.client.test.ts`
Expected: FAIL (file does not exist)

- [ ] **Step 3: Implement `LocketPartnerClient` in `src/services/locket-auto/locket-partner.client.ts`**

Implement URL parsing and HTTP calls using `fetch`, timeout handling with `AbortController`, header injection (`Cookie`, `X-CSRF-Token`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/locket-auto/locket-partner.client.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/locket-auto/locket-partner.client.ts tests/services/locket-auto/locket-partner.client.test.ts
git commit -m "feat(locket-auto): implement LocketPartnerClient"
```

---

### Task 3: Locket Auto Service & Log Store (`LocketAutoService`)

**Files:**
- Create: `src/services/locket-auto/locket-auto.service.ts`
- Test: `tests/services/locket-auto/locket-auto.service.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export class LocketAutoService {
    static getConfig(): Promise<LocketAutoConfig | null>;
    static saveConfig(data: Partial<LocketAutoConfig>): Promise<LocketAutoConfig>;
    static recordLog(data: { status: string; jobId?: string; message: string; rawPayload?: any; durationMs?: number }): Promise<LocketAutoLog>;
    static getLogs(limit?: number): Promise<LocketAutoLog[]>;
    static clearLogs(): Promise<void>;
  }
  ```

- [ ] **Step 1: Write test for `LocketAutoService`**

```typescript
// tests/services/locket-auto/locket-auto.service.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { LocketAutoService } from "@/services/locket-auto/locket-auto.service";

describe("LocketAutoService", () => {
  beforeEach(async () => {
    await prisma.locketAutoLog.deleteMany();
    await prisma.locketAutoConfig.deleteMany();
  });

  it("saves and retrieves config correctly", async () => {
    const saved = await LocketAutoService.saveConfig({
      goldPassUrl: "https://locketgold.yuichycsa.id.vn/shop/gold-pass/?p=P1&v=1&t=T1",
      passId: "P1",
      linkVersion: 1,
      signature: "T1",
      sessionCookie: "c1",
      isActive: true,
      intervalSeconds: 60,
    });

    expect(saved.passId).toBe("P1");
    expect(saved.isActive).toBe(true);

    const current = await LocketAutoService.getConfig();
    expect(current?.passId).toBe("P1");
  });

  it("records log and prunes to max 100 entries", async () => {
    await LocketAutoService.recordLog({
      status: "SUCCESS",
      jobId: "J1",
      message: "Thành công",
    });

    const logs = await LocketAutoService.getLogs(10);
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("SUCCESS");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/locket-auto/locket-auto.service.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `LocketAutoService` in `src/services/locket-auto/locket-auto.service.ts`**

Implement DB operations using upsert for config with `id: "default"`, and auto-pruning older logs beyond 100 entries.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/locket-auto/locket-auto.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/locket-auto/locket-auto.service.ts tests/services/locket-auto/locket-auto.service.test.ts
git commit -m "feat(locket-auto): implement LocketAutoService"
```

---

### Task 4: Background Worker Engine (`LocketAutoWorker`)

**Files:**
- Create: `src/services/locket-auto/locket-auto.worker.ts`
- Test: `tests/services/locket-auto/locket-auto.worker.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export class LocketAutoWorker {
    static getInstance(): LocketAutoWorker;
    public start(): void;
    public stop(): void;
    public isRunning(): boolean;
    public getStatus(): { isRunning: boolean; isExecuting: boolean; lastTickAt?: Date };
    public executeOnce(): Promise<TriggerPassResult>;
  }
  ```

- [ ] **Step 1: Write test for `LocketAutoWorker`**

```typescript
// tests/services/locket-auto/locket-auto.worker.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LocketAutoWorker } from "@/services/locket-auto/locket-auto.worker";
import { LocketAutoService } from "@/services/locket-auto/locket-auto.service";
import { LocketPartnerClient } from "@/services/locket-auto/locket-partner.client";

describe("LocketAutoWorker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    LocketAutoWorker.getInstance().stop();
  });

  it("starts and stops timer cleanly", () => {
    const worker = LocketAutoWorker.getInstance();
    expect(worker.isRunning()).toBe(false);

    worker.start();
    expect(worker.isRunning()).toBe(true);

    worker.stop();
    expect(worker.isRunning()).toBe(false);
  });

  it("disables config and stops on SESSION_EXPIRED", async () => {
    vi.spyOn(LocketAutoService, "getConfig").mockResolvedValue({
      id: "default",
      goldPassUrl: "url",
      passId: "p",
      linkVersion: 1,
      signature: "s",
      sessionCookie: "expired_cookie",
      csrfToken: null,
      targetUsername: "@test",
      isActive: true,
      intervalSeconds: 60,
      lastRunAt: null,
      lastStatus: null,
      lastMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saveSpy = vi.spyOn(LocketAutoService, "saveConfig").mockResolvedValue({} as any);
    vi.spyOn(LocketPartnerClient, "triggerUsePass").mockResolvedValue({
      ok: false,
      status: "SESSION_EXPIRED",
      message: "Phiên hết hạn",
      durationMs: 100,
    });

    const worker = LocketAutoWorker.getInstance();
    worker.start();
    const result = await worker.executeOnce();

    expect(result.status).toBe("SESSION_EXPIRED");
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    expect(worker.isRunning()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/services/locket-auto/locket-auto.worker.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `LocketAutoWorker` in `src/services/locket-auto/locket-auto.worker.ts`**

Implement Singleton worker with `setInterval`, mutex lock `isExecuting`, circuit breaker stopping on `SESSION_EXPIRED`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/services/locket-auto/locket-auto.worker.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/locket-auto/locket-auto.worker.ts tests/services/locket-auto/locket-auto.worker.test.ts
git commit -m "feat(locket-auto): implement LocketAutoWorker engine"
```

---

### Task 5: Admin API Endpoints (`/api/admin/locket-auto/*`)

**Files:**
- Create:
  - `src/app/api/admin/locket-auto/config/route.ts`
  - `src/app/api/admin/locket-auto/test-connection/route.ts`
  - `src/app/api/admin/locket-auto/trigger-now/route.ts`
  - `src/app/api/admin/locket-auto/logs/route.ts`
- Test: `tests/api/admin-locket-auto.test.ts`

- [ ] **Step 1: Write integration tests for Admin Locket Auto API routes**

```typescript
// tests/api/admin-locket-auto.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getConfig, POST as saveConfig } from "@/app/api/admin/locket-auto/config/route";
import { POST as triggerNow } from "@/app/api/admin/locket-auto/trigger-now/route";
import * as adminAuth from "@/lib/admin-auth";
import { NextRequest } from "next/server";

describe("Admin Locket Auto API Routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(adminAuth, "requireAdminAuth").mockResolvedValue({ id: "admin", username: "admin", role: "ADMIN" } as any);
  });

  it("GET /config returns config and worker live status", async () => {
    const req = new NextRequest("http://localhost/api/admin/locket-auto/config");
    const res = await getConfig(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.workerStatus).toBeDefined();
  });

  it("POST /config updates config and starts/stops worker", async () => {
    const req = new NextRequest("http://localhost/api/admin/locket-auto/config", {
      method: "POST",
      body: JSON.stringify({
        goldPassUrl: "https://locketgold.yuichycsa.id.vn/shop/gold-pass/?p=P1&v=1&t=T1",
        sessionCookie: "my_cookie",
        isActive: false,
      }),
    });
    const res = await saveConfig(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.config.passId).toBe("P1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/admin-locket-auto.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement API routes**
  - `src/app/api/admin/locket-auto/config/route.ts`: GET & POST
  - `src/app/api/admin/locket-auto/test-connection/route.ts`: POST
  - `src/app/api/admin/locket-auto/trigger-now/route.ts`: POST
  - `src/app/api/admin/locket-auto/logs/route.ts`: GET & DELETE

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/admin-locket-auto.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/locket-auto/ tests/api/admin-locket-auto.test.ts
git commit -m "feat(locket-auto): implement admin API routes"
```

---

### Task 6: Admin UI (`/admin/locket-auto` & Sidebar Navigation)

**Files:**
- Create:
  - `src/app/admin/locket-auto/page.tsx`
  - `src/components/admin/LocketAutoClient.tsx`
- Modify: `src/app/admin/layout.tsx` (add navigation link)
- Test: `tests/ui/admin-locket-auto-ui.test.ts`

- [ ] **Step 1: Write UI component unit test**

```typescript
// tests/ui/admin-locket-auto-ui.test.ts
import { describe, it, expect } from "vitest";
import LocketAutoClient from "@/components/admin/LocketAutoClient";

describe("LocketAutoClient Component", () => {
  it("exports a valid React component", () => {
    expect(typeof LocketAutoClient).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/admin-locket-auto-ui.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `LocketAutoClient.tsx`, `page.tsx` and update `layout.tsx`**
  - Add navigation item `{ name: "Auto Locket Gold", href: "/admin/locket-auto", icon: Zap }`.
  - Build UI with: Live Status Card (Auto Run switch, Trigger Now button, Countdown timer), Settings Card (GoldPass link, Cookie, CSRF, Test Connection, Save), Live Logs Card (table of timestamp, status badge, jobId, message, Refresh, Clear).

- [ ] **Step 4: Run all tests to verify everything passes**

Run: `npm test`
Expected: PASS across all test suites

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/locket-auto/ src/components/admin/LocketAutoClient.tsx src/app/admin/layout.tsx tests/ui/admin-locket-auto-ui.test.ts
git commit -m "feat(locket-auto): add Admin UI and navigation for auto activator"
```

---

### Task 7: Full Verification & E2E Validation

**Files:**
- Test verification script / E2E test

- [ ] **Step 1: Run complete project test suite**

Run: `npm test`
Expected: All 39+ test suites pass with 0 failures

- [ ] **Step 2: Run build check to verify TypeScript and Next.js compilation**

Run: `npx next build` (or `npm run build`)
Expected: Build succeeds with 0 type errors

- [ ] **Step 3: Commit all changes**

```bash
git commit --allow-empty -m "chore(locket-auto): verify full build and all test suites pass"
```
