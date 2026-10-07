# Task 1 Brief: Prisma Schema & Models (LocketAutoConfig, LocketAutoLog)

## Files:
- Modify: `prisma/schema.prisma`
- Test: `tests/db-locket-auto.test.ts`
- Report: `.superpowers/sdd/2026-10-07-locket-gold-auto/task-1-report.md`

## Instructions:
1. Write the failing test in `tests/db-locket-auto.test.ts`:
   - Test creating and querying `prisma.locketAutoConfig`
   - Test creating and querying `prisma.locketAutoLog`
2. Run test to verify it fails (`npx vitest run tests/db-locket-auto.test.ts`).
3. Add models to `prisma/schema.prisma`:
```prisma
model LocketAutoConfig {
  id              String    @id @default("default")
  goldPassUrl     String    // Full URL GoldPass
  passId          String    // Trích xuất từ URL (tham số ?p=)
  linkVersion     Int       @default(1) // Tham số ?v=
  signature       String    // Tham số ?t=
  sessionCookie   String    // Cookie đăng nhập tài khoản Yuicsa
  csrfToken       String?   // CSRF token nếu đối tác yêu cầu
  targetUsername  String?   // @qthinh0106
  isActive        Boolean   @default(false) // Trạng thái bật/tắt Auto 24/7
  intervalSeconds Int       @default(60)    // Khoảng cách giữa các lần kích
  lastRunAt       DateTime? // Lần kích gần nhất
  lastStatus      String?   // SUCCESS | COOLDOWN | FAILED | SESSION_EXPIRED
  lastMessage     String?   // Chi tiết phản hồi từ đối tác
  updatedAt       DateTime  @updatedAt
  createdAt       DateTime  @default(now())
}

model LocketAutoLog {
  id          String   @id @default(uuid())
  status      String   // SUCCESS | COOLDOWN | FAILED | SESSION_EXPIRED
  jobId       String?  // Mã job nhận từ đối tác nếu có
  message     String   // Mô tả kết quả
  rawPayload  String?  // JSON response từ đối tác
  durationMs  Int?     // Thời gian phản hồi mạng (ms)
  createdAt   DateTime @default(now())

  @@index([createdAt])
}
```
4. Run `npx prisma db push` to synchronize SQLite database schema and generate Prisma client.
5. Run test to verify it passes (`npx vitest run tests/db-locket-auto.test.ts`).
6. Commit changes with `git commit -m "feat(locket-auto): add prisma schema models for auto activator"`.
7. Write output report to `.superpowers/sdd/2026-10-07-locket-gold-auto/task-1-report.md`.
