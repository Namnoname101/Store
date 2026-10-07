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

    it("should include Origin, Referer and browser headers in triggerUsePass", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { job_id: "JOB-BROWSER" },
        }),
      } as any);

      await LocketPartnerClient.triggerUsePass({
        passId: "P_BROWSER",
        linkVersion: 2,
        signature: "SIG_BROWSER",
        cookie: "session_val",
        csrfToken: "csrf_val",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://locketgold.yuichycsa.id.vn/api/v1/goldpass/use",
        expect.objectContaining({
          headers: expect.objectContaining({
            Origin: "https://locketgold.yuichycsa.id.vn",
            Referer: "https://locketgold.yuichycsa.id.vn/shop/gold-pass/?p=P_BROWSER&v=2&t=SIG_BROWSER",
            "User-Agent": expect.stringContaining("Mozilla/5.0"),
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "X-CSRF-Token": "csrf_val",
            Cookie: "session_val",
          }),
        })
      );
    });

    it("should handle 403 origin_denied gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          ok: false,
          code: "origin_denied",
          message: "Nguồn truy cập không hợp lệ.",
        }),
      } as any);

      const res = await LocketPartnerClient.triggerUsePass({
        passId: "P_DENIED",
        linkVersion: 1,
        signature: "SIG",
        cookie: "session",
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe("FAILED");
      expect(res.message).toContain("Origin Denied");
    });

    it("should automatically resolve csrf token via fetchSessionInfo when csrfToken is missing", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          // 1st call: fetchSessionInfo
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            data: {
              username: "auto_user",
              csrf_token: "auto_csrf_token_xyz",
            },
          }),
        } as any)
        .mockResolvedValueOnce({
          // 2nd call: usePass
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            data: { job_id: "JOB-AUTO-CSRF" },
          }),
        } as any);

      const res = await LocketPartnerClient.triggerUsePass({
        passId: "P_AUTOCSRF",
        linkVersion: 1,
        signature: "SIG_AUTOCSRF",
        cookie: "valid_session",
      });

      expect(res.ok).toBe(true);
      expect(res.jobId).toBe("JOB-AUTO-CSRF");
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "https://locketgold.yuichycsa.id.vn/api/v1/goldpass/use",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-CSRF-Token": "auto_csrf_token_xyz",
          }),
        })
      );
    });
  });

  describe("getBrowserHeaders", () => {
    it("should construct required headers with correct origin and referer", () => {
      const headers = LocketPartnerClient.getBrowserHeaders({
        baseUrl: "https://locketgold.yuichycsa.id.vn",
        passId: "P123",
        linkVersion: 2,
        signature: "SIG123",
        cookie: "sess_cookie",
        csrfToken: "csrf_token_val",
      });

      expect(headers.Origin).toBe("https://locketgold.yuichycsa.id.vn");
      expect(headers.Referer).toBe(
        "https://locketgold.yuichycsa.id.vn/shop/gold-pass/?p=P123&v=2&t=SIG123"
      );
      expect(headers["User-Agent"]).toContain("Mozilla/5.0");
      expect(headers["Sec-Fetch-Site"]).toBe("same-origin");
      expect(headers["Sec-Fetch-Mode"]).toBe("cors");
      expect(headers["Cookie"]).toBe("sess_cookie");
      expect(headers["X-CSRF-Token"]).toBe("csrf_token_val");
    });
  });

  describe("fetchSessionInfo", () => {
    it("should return username and csrf token on 200 ok from auth/me", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          data: {
            username: "yuicsa_admin",
            csrf_token: "csrf_token_abc",
          },
        }),
      } as any);

      const res = await LocketPartnerClient.fetchSessionInfo({
        cookie: "sess_ok",
      });

      expect(res.ok).toBe(true);
      expect(res.username).toBe("yuicsa_admin");
      expect(res.csrfToken).toBe("csrf_token_abc");
    });

    it("should fallback to guest/overview when auth/me fails (guest session)", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          // 1st call: auth/me -> 401 session_expired
          ok: false,
          status: 401,
          json: async () => ({
            ok: false,
            code: "session_expired",
            message: "Phiên đăng nhập đã hết hạn.",
          }),
        } as any)
        .mockResolvedValueOnce({
          // 2nd call: guest/overview -> 200 ok
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            data: {
              csrf_token: "guest_csrf_token_xyz",
            },
          }),
        } as any);

      const res = await LocketPartnerClient.fetchSessionInfo({
        cookie: "__Host-yui_guest=guest_123",
      });

      expect(res.ok).toBe(true);
      expect(res.username).toBe("Khách (Guest)");
      expect(res.csrfToken).toBe("guest_csrf_token_xyz");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should handle error when both auth/me and guest/overview fail", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          ok: false,
          message: "Lỗi máy chủ đối tác",
        }),
      } as any);

      const res = await LocketPartnerClient.fetchSessionInfo({
        cookie: "sess_broken",
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe("Lỗi máy chủ đối tác");
    });
  });
});
