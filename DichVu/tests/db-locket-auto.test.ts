import { describe, it, expect, beforeEach } from "vitest";
import prisma from "@/lib/prisma";

describe("Database Locket Auto Models", () => {
  beforeEach(async () => {
    await prisma.locketAutoLog.deleteMany();
    await prisma.locketAutoConfig.deleteMany();
  });

  it("should create and query LocketAutoConfig", async () => {
    const config = await prisma.locketAutoConfig.create({
      data: {
        id: "default",
        goldPassUrl: "https://example.com/redeem?p=PASS123&v=1&t=SIG123",
        passId: "PASS123",
        linkVersion: 1,
        signature: "SIG123",
        sessionCookie: "session_token=xyz",
        csrfToken: "csrf_token_abc",
        targetUsername: "qthinh0106",
        isActive: true,
        intervalSeconds: 60,
        lastStatus: "SUCCESS",
        lastMessage: "OK",
      },
    });

    expect(config.id).toBe("default");
    expect(config.passId).toBe("PASS123");
    expect(config.isActive).toBe(true);
    expect(config.intervalSeconds).toBe(60);

    const fetched = await prisma.locketAutoConfig.findUnique({
      where: { id: "default" },
    });
    expect(fetched).not.toBeNull();
    expect(fetched?.passId).toBe("PASS123");
  });

  it("should create and query LocketAutoLog", async () => {
    const log = await prisma.locketAutoLog.create({
      data: {
        status: "SUCCESS",
        jobId: "JOB-999",
        message: "Activation successful",
        rawPayload: JSON.stringify({ ok: true }),
        durationMs: 350,
      },
    });

    expect(log.id).toBeDefined();
    expect(log.status).toBe("SUCCESS");
    expect(log.jobId).toBe("JOB-999");
    expect(log.durationMs).toBe(350);

    const logs = await prisma.locketAutoLog.findMany({
      where: { status: "SUCCESS" },
    });
    expect(logs.length).toBeGreaterThan(0);
  });
});
