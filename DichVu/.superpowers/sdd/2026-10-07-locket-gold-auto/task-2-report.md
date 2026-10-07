# Task 2 Report: Locket Partner Client (LocketPartnerClient)

## Status
DONE

## Commit
- Hash: `2d13aa11dbe135fbfe014a2dd1d71fd2d8b00303` (short: `2d13aa1`)
- Message: `feat: implement checkOrderStatus in supplier adapter interface and HackTim adapter` (included Task 2 files `src/services/locket-auto/locket-partner.client.ts` and `tests/services/locket-auto/locket-partner.client.test.ts`)

## Implementation Details
1. **Failing Test (Red Phase)**:
   - Created `tests/services/locket-auto/locket-partner.client.test.ts` covering:
     - `parseUrl`: valid URL params (`p`, `v`, `t`), missing params errors, default `linkVersion = 1`, invalid URL parsing.
     - `testAccess`: successful access with subscription username / fallback username, 401 session expiry, 400 error handling, network failure.
     - `triggerUsePass`: successful pass redemption returning `jobId`, 401 session expiry, cooldown detection (status `COOLDOWN`), general failure, network failure, request body and header verification.
   - Executed `npx vitest run tests/services/locket-auto/locket-partner.client.test.ts` -> Failed with `Cannot find module '@/services/locket-auto/locket-partner.client'`.

2. **Client Implementation (Green Phase)**:
   - Implemented `LocketPartnerClient` in `src/services/locket-auto/locket-partner.client.ts` with:
     - `parseUrl(url: string): ParsedGoldPassUrl`
     - `testAccess(params): Promise<TestAccessResult>`
     - `triggerUsePass(params): Promise<TriggerPassResult>`
   - Handled cooldown status detection, 15-second AbortSignal timeout, session expiration (401), and idempotency keys.
   - Executed `npx vitest run tests/services/locket-auto/locket-partner.client.test.ts` -> All 15 tests passed.

## Test Results
- File: `tests/services/locket-auto/locket-partner.client.test.ts`
- Result: 15/15 tests passed (10ms)
- Checks:
  - `parseUrl`:
    - `should correctly parse valid GoldPass url with p, v, t` (PASSED)
    - `should default linkVersion to 1 if v parameter is missing or non-numeric` (PASSED)
    - `should throw error if passId (p) or signature (t) is missing` (PASSED)
    - `should throw error if URL is completely invalid` (PASSED)
  - `testAccess`:
    - `should successfully test access and extract target username from subscription` (PASSED)
    - `should support fallback locket username and default baseUrl override` (PASSED)
    - `should handle 401 session expired` (PASSED)
    - `should handle 400 or other errors with payload message` (PASSED)
    - `should handle network errors gracefully` (PASSED)
  - `triggerUsePass`:
    - `should trigger use pass successfully and return jobId` (PASSED)
    - `should support jobId from data.job_id directly` (PASSED)
    - `should handle 401 session expired` (PASSED)
    - `should handle 400 or 429 cooldown status` (PASSED)
    - `should handle 400 or 429 general failure when no cooldown indicator` (PASSED)
    - `should handle network error / fetch rejection` (PASSED)

## Concerns
None.
