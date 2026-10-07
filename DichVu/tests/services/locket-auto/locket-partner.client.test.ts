import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LocketPartnerClient } from "@/services/locket-auto/locket-partner.client";

describe("LocketPartnerClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("parseUrl", () => {
    it("should correctly parse valid GoldPass url with p, v, t", () => {
      const url = "https://locketgold.yuichycsa.id.vn/redeem?p=PASS123&v=2&t=SIG456";
      const result = LocketPartnerClient.parseUrl(url);

      expect(result).toEqual({
        passId: "PASS123",
        linkVersion: 2,
        signature: "SIG456",
      });
    });

    it("should default linkVersion to 1 if v parameter is missing or non-numeric", () => {
      const urlWithoutV = "https://locketgold.yuichycsa.id.vn/redeem?p=PASS_ABC&t=SIG_XYZ";
      const result1 = LocketPartnerClient.parseUrl(urlWithoutV);
      expect(result1.linkVersion).toBe(1);
      expect(result1.passId).toBe("PASS_ABC");
      expect(result1.signature).toBe("SIG_XYZ");

      const urlWithInvalidV = "https://locketgold.yuichycsa.id.vn/redeem?p=PASS_ABC&v=invalid&t=SIG_XYZ";
      const result2 = LocketPartnerClient.parseUrl(urlWithInvalidV);
      expect(result2.linkVersion).toBe(1);
    });

    it("should throw error if passId (p) or signature (t) is missing", () => {
      const missingP = "https://locketgold.yuichycsa.id.vn/redeem?v=1&t=SIG123";
      expect(() => LocketPartnerClient.parseUrl(missingP)).toThrow(
        "Thiếu tham số pass_id (?p=) hoặc signature (?t=) trong link GoldPass"
      );

      const missingT = "https://locketgold.yuichycsa.id.vn/redeem?p=PASS123&v=1";
      expect(() => LocketPartnerClient.parseUrl(missingT)).toThrow(
        "Thiếu tham số pass_id (?p=) hoặc signature (?t=) trong link GoldPass"
      );
    });

    it("should throw error if URL is completely invalid", () => {
      expect(() => LocketPartnerClient.parseUrl("not-a-valid-url")).toThrow();
    });
  });

  describe("testAccess", () => {
    it("should successfully test access and extract target username from subscription", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            subscription: {
              locket_username: "user_test",
              status_label: "Active",
              cooldown_remaining: 120,
            },
          },
        }),
      } as any);

      const res = await LocketPartnerClient.testAccess({
        passId: "P1",
        linkVersion: 1,
        signature: "S1",
        cookie: "session=abc",
      });

      expect(res.ok).toBe(true);
      expect(res.targetUsername).toBe("user_test");
      expect(res.statusLabel).toBe("Active");
      expect(res.cooldownRemaining).toBe(120);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://locketgold.yuichycsa.id.vn/api/v1/goldpass/access?p=P1&v=1&t=S1",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Accept: "application/json",
            Cookie: "session=abc",
          }),
        })
      );
    });

    it("should support fallback locket username and default baseUrl override", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status_label: "Ready",
          data: {
            locket: {
              username: "fallback_user",
            },
          },
        }),
      } as any);

      const res = await LocketPartnerClient.testAccess({
        passId: "P2",
        linkVersion: 2,
        signature: "S2",
        cookie: "session=xyz",
        baseUrl: "https://custom-domain.com",
      });

      expect(res.ok).toBe(true);
      expect(res.targetUsername).toBe("fallback_user");
      expect(res.statusLabel).toBe("Ready");
      expect(res.cooldownRemaining).toBe(0);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://custom-domain.com/api/v1/goldpass/access?p=P2&v=2&t=S2",
        expect.any(Object)
      );
    });

    it("should handle 401 session expired", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      } as any);

      const res = await LocketPartnerClient.testAccess({
        passId: "P1",
        linkVersion: 1,
        signature: "S1",
        cookie: "expired_cookie",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe("Phiên đăng nhập hết hạn (401)");
    });

    it("should handle 400 or other errors with payload message", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: "Mã thẻ không hợp lệ" }),
      } as any);

      const res = await LocketPartnerClient.testAccess({
        passId: "INVALID",
        linkVersion: 1,
        signature: "S1",
        cookie: "cookie",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe("Mã thẻ không hợp lệ");
    });

    it("should handle network errors gracefully", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network disconnected"));

      const res = await LocketPartnerClient.testAccess({
        passId: "P1",
        linkVersion: 1,
        signature: "S1",
        cookie: "cookie",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe("Network disconnected");
    });
  });

  describe("triggerUsePass", () => {
    it("should trigger use pass successfully and return jobId", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: "Tiếp nhận thành công",
          data: {
            job: {
              job_id: "JOB-12345",
            },
          },
        }),
      } as any);

      const res = await LocketPartnerClient.triggerUsePass({
        passId: "PASS1",
        linkVersion: 1,
        signature: "SIG1",
        cookie: "cookie_val",
        csrfToken: "csrf_token_123",
      });

      expect(res.ok).toBe(true);
      expect(res.status).toBe("SUCCESS");
      expect(res.jobId).toBe("JOB-12345");
      expect(res.message).toBe("Tiếp nhận thành công");
      expect(res.durationMs).toBeGreaterThanOrEqual(0);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://locketgold.yuichycsa.id.vn/api/v1/goldpass/use",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Accept: "application/json",
            Cookie: "cookie_val",
            "X-CSRF-Token": "csrf_token_123",
          }),
          body: expect.stringContaining("PASS1"),
        })
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const sentBody = JSON.parse(callArgs[1].body);
      expect(sentBody.pass_id).toBe("PASS1");
      expect(sentBody.link_version).toBe(1);
      expect(sentBody.signature).toBe("SIG1");
      expect(sentBody.idempotency_key).toBeDefined();
    });

    it("should support jobId from data.job_id directly", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            job_id: "JOB-DIRECT",
          },
        }),
      } as any);

      const res = await LocketPartnerClient.triggerUsePass({
        passId: "PASS1",
        linkVersion: 1,
        signature: "SIG1",
        cookie: "cookie_val",
      });

      expect(res.ok).toBe(true);
      expect(res.status).toBe("SUCCESS");
      expect(res.jobId).toBe("JOB-DIRECT");
    });

    it("should handle 401 session expired", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      } as any);

      const res = await LocketPartnerClient.triggerUsePass({
        passId: "PASS1",
        linkVersion: 1,
        signature: "SIG1",
        cookie: "expired_cookie",
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe("SESSION_EXPIRED");
      expect(res.message).toContain("Phiên đăng nhập đối tác đã hết hạn");
    });

    it("should handle 400 or 429 cooldown status", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          message: "Vui lòng chờ 3 phút cooldown trước khi kích hoạt lại",
          cooldown_remaining: 180,
        }),
      } as any);

      const res = await LocketPartnerClient.triggerUsePass({
        passId: "PASS1",
        linkVersion: 1,
        signature: "SIG1",
        cookie: "cookie_val",
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe("COOLDOWN");
      expect(res.message).toContain("cooldown");
    });

    it("should handle 400 or 429 general failure when no cooldown indicator", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          message: "Mã thẻ đã được sử dụng",
        }),
      } as any);

      const res = await LocketPartnerClient.triggerUsePass({
        passId: "PASS1",
        linkVersion: 1,
        signature: "SIG1",
        cookie: "cookie_val",
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe("FAILED");
      expect(res.message).toBe("Mã thẻ đã được sử dụng");
    });

    it("should handle network error / fetch rejection", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Timeout connection"));

      const res = await LocketPartnerClient.triggerUsePass({
        passId: "PASS1",
        linkVersion: 1,
        signature: "SIG1",
        cookie: "cookie_val",
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe("FAILED");
      expect(res.message).toBe("Timeout connection");
    });
  });
});
