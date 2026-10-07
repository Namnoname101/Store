import { describe, it, expect, beforeEach } from "vitest";
import prisma from "@/lib/prisma";
import { LocketAutoService } from "@/services/locket-auto/locket-auto.service";

describe("LocketAutoService", () => {
  beforeEach(async () => {
    await prisma.locketAutoLog.deleteMany();
    await prisma.locketAutoConfig.deleteMany();
  });

  describe("getConfig and saveConfig", () => {
    it("should return null if no config exists", async () => {
      const config = await LocketAutoService.getConfig();
      expect(config).toBeNull();
    });

    it("should create config with default values on initial save", async () => {
      const saved = await LocketAutoService.saveConfig({
        goldPassUrl: "https://example.com/redeem?p=P1&v=1&t=T1",
        passId: "P1",
        signature: "T1",
        sessionCookie: "session_val",
      });

      expect(saved.id).toBe("default");
      expect(saved.goldPassUrl).toBe("https://example.com/redeem?p=P1&v=1&t=T1");
      expect(saved.passId).toBe("P1");
      expect(saved.linkVersion).toBe(1);
      expect(saved.signature).toBe("T1");
      expect(saved.sessionCookie).toBe("session_val");
      expect(saved.isActive).toBe(false);
      expect(saved.intervalSeconds).toBe(60);

      const fetched = await LocketAutoService.getConfig();
      expect(fetched).not.toBeNull();
      expect(fetched?.passId).toBe("P1");
    });

    it("should update existing config without overwriting unspecified fields", async () => {
      await LocketAutoService.saveConfig({
        goldPassUrl: "https://example.com/redeem?p=ORIG&t=T0",
        passId: "ORIG",
        signature: "T0",
        sessionCookie: "orig_cookie",
        isActive: false,
        intervalSeconds: 120,
      });

      const updated = await LocketAutoService.saveConfig({
        isActive: true,
        lastStatus: "SUCCESS",
        lastMessage: "Test run successful",
        lastRunAt: new Date("2026-10-07T12:00:00Z"),
      });

      expect(updated.isActive).toBe(true);
      expect(updated.lastStatus).toBe("SUCCESS");
      expect(updated.lastMessage).toBe("Test run successful");
      expect(updated.passId).toBe("ORIG");
      expect(updated.sessionCookie).toBe("orig_cookie");
      expect(updated.intervalSeconds).toBe(120);
    });

    it("should handle custom targetUsername and csrfToken", async () => {
      const saved = await LocketAutoService.saveConfig({
        goldPassUrl: "https://example.com/test",
        passId: "P2",
        signature: "T2",
        sessionCookie: "cookie2",
        csrfToken: "csrf_123",
        targetUsername: "qthinh0106",
      });

      expect(saved.csrfToken).toBe("csrf_123");
      expect(saved.targetUsername).toBe("qthinh0106");
    });
  });

  describe("recordLog, getLogs, and clearLogs", () => {
    it("should record log with string and object rawPayload", async () => {
      const log1 = await LocketAutoService.recordLog({
        status: "SUCCESS",
        jobId: "JOB-1",
        message: "Activation successful",
        rawPayload: { code: 200, result: "OK" },
        durationMs: 250,
      });

      expect(log1.id).toBeDefined();
      expect(log1.status).toBe("SUCCESS");
      expect(log1.jobId).toBe("JOB-1");
      expect(log1.message).toBe("Activation successful");
      expect(log1.durationMs).toBe(250);
      expect(JSON.parse(log1.rawPayload!)).toEqual({ code: 200, result: "OK" });

      const log2 = await LocketAutoService.recordLog({
        status: "FAILED",
        message: "Network error",
        rawPayload: "raw error message",
      });

      expect(log2.status).toBe("FAILED");
      expect(log2.jobId).toBeNull();
      expect(log2.rawPayload).toBe("raw error message");
      expect(log2.durationMs).toBeNull();
    });

    it("should retrieve logs ordered by createdAt desc with default and custom limits", async () => {
      for (let i = 1; i <= 5; i++) {
        await LocketAutoService.recordLog({
          status: "SUCCESS",
          message: `Log message ${i}`,
        });
      }

      const logsAll = await LocketAutoService.getLogs();
      expect(logsAll.length).toBe(5);
      expect(logsAll[0].message).toBe("Log message 5");

      const logsLimited = await LocketAutoService.getLogs(3);
      expect(logsLimited.length).toBe(3);
      expect(logsLimited[0].message).toBe("Log message 5");
      expect(logsLimited[2].message).toBe("Log message 3");
    });

    it("should prune older logs when log count exceeds 100", async () => {
      // Create 102 logs in the past
      for (let i = 1; i <= 102; i++) {
        await prisma.locketAutoLog.create({
          data: {
            status: "SUCCESS",
            message: `Log ${i}`,
            createdAt: new Date(Date.now() - (105 - i) * 1000),
          },
        });
      }

      // Record one more log via service which should trigger pruning
      await LocketAutoService.recordLog({
        status: "SUCCESS",
        message: "Log 103",
      });

      const totalCount = await prisma.locketAutoLog.count();
      expect(totalCount).toBe(100);

      const logs = await LocketAutoService.getLogs(100);
      expect(logs.length).toBe(100);
      // Log 1 and Log 2 (and any older) should have been pruned
      const messages = logs.map((l) => l.message);
      expect(messages).not.toContain("Log 1");
      expect(messages).not.toContain("Log 2");
      expect(messages).toContain("Log 103");
    });

    it("should clear all logs", async () => {
      await LocketAutoService.recordLog({
        status: "SUCCESS",
        message: "To be cleared",
      });

      const before = await LocketAutoService.getLogs();
      expect(before.length).toBe(1);

      await LocketAutoService.clearLogs();

      const after = await LocketAutoService.getLogs();
      expect(after.length).toBe(0);
    });
  });
});
