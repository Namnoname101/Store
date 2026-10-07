# Task 6 Brief: Admin UI (`/admin/locket-auto` & Sidebar Navigation)

## Files:
- Create:
  - `src/app/admin/locket-auto/page.tsx`
  - `src/components/admin/LocketAutoClient.tsx`
- Modify: `src/app/admin/layout.tsx` (add navigation item)
- Test: `tests/ui/admin-locket-auto-ui.test.ts`
- Report: `.superpowers/sdd/2026-10-07-locket-gold-auto/task-6-report.md`

## Requirements:
1. **Sidebar Navigation**:
   - Add `{ name: "Auto Locket Gold", href: "/admin/locket-auto", icon: Zap, current: pathname.startsWith("/admin/locket-auto") }` to `src/app/admin/layout.tsx`.
2. **Server Page (`src/app/admin/locket-auto/page.tsx`)**:
   - Renders `LocketAutoClient`.
3. **Client Component (`src/components/admin/LocketAutoClient.tsx`)**:
   - Live status card with Auto 24/7 toggle switch, immediate manual trigger button, and status indicators.
   - Configuration card with GoldPass URL, Session Cookie, CSRF Token, Interval seconds, Test Connection button, and Save Config button.
   - Execution logs card with table/list of timestamp, status badge, message, duration, refresh button, and clear logs button.
4. **Test (`tests/ui/admin-locket-auto-ui.test.ts`)**:
   - Unit test asserting `LocketAutoClient` and page components export valid functions.

## Steps:
1. Write test in `tests/ui/admin-locket-auto-ui.test.ts`.
2. Verify test fails.
3. Update `src/app/admin/layout.tsx`, create `src/components/admin/LocketAutoClient.tsx` and `src/app/admin/locket-auto/page.tsx`.
4. Verify tests pass.
5. Commit: `feat(locket-auto): implement admin UI and sidebar navigation`.
6. Write report to `.superpowers/sdd/2026-10-07-locket-gold-auto/task-6-report.md`.
