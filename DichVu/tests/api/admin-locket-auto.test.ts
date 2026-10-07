import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getConfig, POST as saveConfig } from "@/app/api/admin/locket-auto/config/route";
import { POST as testConnection } from "@/app/api/admin/locket-auto/test-connection/route";
import { POST as triggerNow } from "@/app/api/admin/locket-auto/trigger-now/route";
import { GET as getLogs, DELETE as clearLogs } from "@/app/api/admin/locket-auto/logs/route";
import * as adminAuth from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { LocketPartnerClient } from "@/services/locket-auto/locket-partner.client";
import { LocketAutoWorker } from "@/services/locket-auto/locket-auto.worker";

describe("Admin Locket Auto API Routes", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await prisma.locketAutoLog.deleteMany();
    await prisma.locketAutoConfig.deleteMany();
    LocketAutoWorker.getInstance().stop();

    // Default to authorized admin
    vi.spyOn(adminAuth, "requireAdminAuth").mockResolvedValue({
      id: "admin",
      username: "admin",
      role: "ADMIN",
    });
  });

  describe("Authentication Guard", () => {
    it("returns 401 on unauthenticated requests", async () => {
      vi.spyOn(adminAuth, "requireAdminAuth").mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/admin/locket-auto/config");
      const res = await getConfig(req);
      expect(res.status).toBe(401);
    });
  });

  describe("GET & POST /api/admin/locket-auto/config", () => {
    it("returns 200 with null config initially and worker status", async () => {
      const req = new NextRequest("http://localhost/api/admin/locket-auto/config");
      const res = await getConfig(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.config).toBeNull();
      expect(data.workerStatus).toBeDefined();
      expect(data.workerStatus.isRunning).toBe(false);
    });

    it("returns 400 when saving invalid goldPassUrl", async () => {
      const req = new NextRequest("http://localhost/api/admin/locket-auto/config", {
        method: "POST",
        body: JSON.stringify({
          goldPassUrl: "https://invalid-url.com",
        }),
      });

      const res = await saveConfig(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Thiếu tham số");
    });

    it("saves valid config and starts worker when isActive is true", async () => {
      const req = new NextRequest("http://localhost/api/admin/locket-auto/config", {
        method: "POST",
        body: JSON.stringify({
          goldPassUrl: "https://locketgold.yuichycsa.id.vn/shop/gold-pass/?p=PASS99&v=1&t=SIG99",
          sessionCookie: "cookie_val_123",
          isActive: true,
          intervalSeconds: 60,
        }),
      });

      // Mock partner call so worker start doesn't hit network
      vi.spyOn(LocketPartnerClient, "triggerUsePass").mockResolvedValue({
        ok: true,
        status: "SUCCESS",
        message: "OK",
        durationMs: 100,
      });

      const res = await saveConfig(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.config.passId).toBe("PASS99");
      expect(data.config.isActive).toBe(true);
      expect(data.workerStatus.isRunning).toBe(true);
    });
  });

  describe("POST /api/admin/locket-auto/test-connection", () => {
    it("tests connection and saves discovered username", async () => {
      vi.spyOn(LocketPartnerClient, "testAccess").mockResolvedValue({
        ok: true,
        targetUsername: "qthinh0106",
        statusLabel: "Chờ kích hoạt",
        cooldownRemaining: 0,
      });

      const req = new NextRequest("http://localhost/api/admin/locket-auto/test-connection", {
        method: "POST",
        body: JSON.stringify({
          goldPassUrl: "https://example.com/shop/?p=P1&v=1&t=T1",
          sessionCookie: "my_cookie",
        }),
      });

      const res = await testConnection(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.targetUsername).toBe("qthinh0106");

      const config = await prisma.locketAutoConfig.findUnique({ where: { id: "default" } });
      expect(config?.targetUsername).toBe("qthinh0106");
    });
  });

  describe("POST /api/admin/locket-auto/trigger-now", () => {
    it("triggers pass execution immediately", async () => {
      await prisma.locketAutoConfig.create({
        data: {
          id: "default",
          goldPassUrl: "https://example.com/p?p=P1&t=T1",
          passId: "P1",
          signature: "T1",
          sessionCookie: "cookie",
        },
      });

      vi.spyOn(LocketPartnerClient, "triggerUsePass").mockResolvedValue({
        ok: true,
        status: "SUCCESS",
        jobId: "JOB_XYZ",
        message: "Kích hoạt thành công",
        durationMs: 250,
      });

      const req = new NextRequest("http://localhost/api/admin/locket-auto/trigger-now", {
        method: "POST",
      });

      const res = await triggerNow(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.status).toBe("SUCCESS");
      expect(data.jobId).toBe("JOB_XYZ");
    });
  });

  describe("GET & DELETE /api/admin/locket-auto/logs", () => {
    it("retrieves and clears logs", async () => {
      await prisma.locketAutoLog.create({
        data: {
          status: "SUCCESS",
          message: "Test log 1",
        },
      });

      const getReq = new NextRequest("http://localhost/api/admin/locket-auto/logs?limit=10");
      const getRes = await getLogs(getReq);
      expect(getRes.status).toBe(200);

      const getData = await getRes.json();
      expect(getData.ok).toBe(true);
      expect(getData.logs.length).toBe(1);

      const delReq = new NextRequest("http://localhost/api/admin/locket-auto/logs", {
        method: "DELETE",
      });
      const delRes = await clearLogs(delReq);
      expect(delRes.status).toBe(200);

      const delData = await delRes.json();
      expect(delData.ok).toBe(true);

      const logsAfter = await prisma.locketAutoLog.count();
      expect(logsAfter).toBe(0);
    });
  });
});
