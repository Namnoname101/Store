# Task 5 Brief: Admin API Endpoints (`/api/admin/locket-auto/*`)

## Files:
- Create:
  - `src/app/api/admin/locket-auto/config/route.ts`
  - `src/app/api/admin/locket-auto/test-connection/route.ts`
  - `src/app/api/admin/locket-auto/trigger-now/route.ts`
  - `src/app/api/admin/locket-auto/logs/route.ts`
- Test: `tests/api/admin-locket-auto.test.ts`
- Report: `.superpowers/sdd/2026-10-07-locket-gold-auto/task-5-report.md`

## Endpoints:
1. `GET /api/admin/locket-auto/config`:
   - Auth check: `requireAdminAuth(req)`.
   - Returns current config & live worker status.
2. `POST /api/admin/locket-auto/config`:
   - Auth check: `requireAdminAuth(req)`.
   - Parses `goldPassUrl` if present, validates parameters.
   - Saves config, starts or stops worker according to `isActive`.
3. `POST /api/admin/locket-auto/test-connection`:
   - Auth check: `requireAdminAuth(req)`.
   - Tests credentials via `LocketPartnerClient.testAccess`.
   - Saves `targetUsername` if resolved.
4. `POST /api/admin/locket-auto/trigger-now`:
   - Auth check: `requireAdminAuth(req)`.
   - Runs immediate trigger via `LocketAutoWorker.getInstance().executeOnce()`.
5. `GET /api/admin/locket-auto/logs`:
   - Auth check: `requireAdminAuth(req)`.
   - Returns execution logs up to `limit` (default 50).
6. `DELETE /api/admin/locket-auto/logs`:
   - Auth check: `requireAdminAuth(req)`.
   - Clears all logs via `LocketAutoService.clearLogs()`.

## Steps:
1. Write integration tests in `tests/api/admin-locket-auto.test.ts`.
2. Run test to verify it fails (`npx vitest run tests/api/admin-locket-auto.test.ts`).
3. Implement routes in `src/app/api/admin/locket-auto/`.
4. Run test to verify it passes.
5. Commit: `feat(locket-auto): implement admin API endpoints`.
6. Write report to `.superpowers/sdd/2026-10-07-locket-gold-auto/task-5-report.md`.
