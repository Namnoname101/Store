# Task 2 Brief: Locket Partner Client (LocketPartnerClient)

## Files:
- Create: `src/services/locket-auto/locket-partner.client.ts`
- Test: `tests/services/locket-auto/locket-partner.client.test.ts`
- Report: `.superpowers/sdd/2026-10-07-locket-gold-auto/task-2-report.md`

## Interfaces:
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
  rawPayload?: any;
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
  static testAccess(params: {
    passId: string;
    linkVersion: number;
    signature: string;
    cookie: string;
    baseUrl?: string;
  }): Promise<TestAccessResult>;
  static triggerUsePass(params: {
    passId: string;
    linkVersion: number;
    signature: string;
    cookie: string;
    csrfToken?: string;
    baseUrl?: string;
  }): Promise<TriggerPassResult>;
}
```

## Requirements & Implementation Details:
1. `parseUrl(url: string)`:
   - Parse using `new URL(url)`. Extract searchParams `p`, `v`, `t`.
   - If missing `p` or `t`: throw new Error("Thiếu tham số pass_id (?p=) hoặc signature (?t=) trong link GoldPass").
   - `v` defaults to 1 if missing or invalid.
   - Return `{ passId: p, linkVersion: parseInt(v) || 1, signature: t }`.
2. `testAccess(...)`:
   - Default `baseUrl`: `"https://locketgold.yuichycsa.id.vn"`
   - Endpoint: `GET ${baseUrl}/api/v1/goldpass/access?p=${passId}&v=${linkVersion}&t=${signature}`
   - Headers: `Accept: application/json`, `Cookie: cookie` (if provided)
   - Handle response:
     - 200: extract `targetUsername` from `data.subscription.locket_username` or `data.locket.username`, `statusLabel`, `cooldownRemaining: data.subscription.cooldown_remaining || 0`. Return `ok: true`.
     - 401: return `ok: false, error: "Phiên đăng nhập hết hạn (401)"`.
     - 400/other: return `ok: false, error: payload.message || "Lỗi truy cập GoldPass"`.
3. `triggerUsePass(...)`:
   - Default `baseUrl`: `"https://locketgold.yuichycsa.id.vn"`
   - Endpoint: `POST ${baseUrl}/api/v1/goldpass/use`
   - Body:
     ```json
     {
       "pass_id": passId,
       "link_version": linkVersion,
       "signature": signature,
       "idempotency_key": crypto.randomUUID()
     }
     ```
   - Headers: `Content-Type: application/json`, `Accept: application/json`, `Cookie: cookie`, and if `csrfToken`: `X-CSRF-Token: csrfToken`.
   - Measure `durationMs = Date.now() - startTime`.
   - Handle response:
     - 200: Return `{ ok: true, status: "SUCCESS", jobId: data?.job?.job_id || data?.job_id, message: payload.message || "Tiếp nhận yêu cầu thành công", durationMs, rawPayload: payload }`.
     - 401: Return `{ ok: false, status: "SESSION_EXPIRED", message: "Phiên đăng nhập đối tác đã hết hạn. Vui lòng cập nhật Cookie mới.", durationMs, rawPayload: payload }`.
     - 400 / 429: If message contains cooldown/chờ or `cooldown_remaining`: Return `{ ok: false, status: "COOLDOWN", message: payload.message || "Đang trong thời gian chờ cooldown", durationMs, rawPayload: payload }`. Otherwise `{ ok: false, status: "FAILED", message: payload.message || "Thao tác không thành công", durationMs, rawPayload: payload }`.
     - Other / Catch Network error: Return `{ ok: false, status: "FAILED", message: error.message || "Lỗi kết nối", durationMs }`.
   - Timeout: Use `AbortSignal.timeout(15000)` or `AbortController` (15s timeout).

## Steps:
1. Write tests in `tests/services/locket-auto/locket-partner.client.test.ts`.
2. Run test to verify it fails (`npx vitest run tests/services/locket-auto/locket-partner.client.test.ts`).
3. Implement `src/services/locket-auto/locket-partner.client.ts`.
4. Run test to verify it passes.
5. Commit: `feat(locket-auto): implement LocketPartnerClient`.
6. Write report to `.superpowers/sdd/2026-10-07-locket-gold-auto/task-2-report.md`.
