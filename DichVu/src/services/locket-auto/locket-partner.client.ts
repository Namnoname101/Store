import crypto from "crypto";

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
  csrfToken?: string;
  cookie?: string;
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

const DEFAULT_BASE_URL = "https://locketgold.yuichycsa.id.vn";

export class LocketPartnerClient {
  /**
   * Helper constructing browser headers to satisfy Yuicsa origin & security checks.
   */
  static getBrowserHeaders(params: {
    baseUrl: string;
    passId?: string;
    linkVersion?: number;
    signature?: string;
    cookie?: string;
    csrfToken?: string;
  }): Record<string, string> {
    const { baseUrl, passId, linkVersion = 1, signature, cookie, csrfToken } = params;
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");

    let referer = `${cleanBaseUrl}/`;
    if (passId && signature) {
      referer = `${cleanBaseUrl}/shop/gold-pass/?p=${encodeURIComponent(
        passId
      )}&v=${encodeURIComponent(linkVersion)}&t=${encodeURIComponent(signature)}`;
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      Origin: cleanBaseUrl,
      Referer: referer,
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      "sec-ch-ua": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    };

    if (cookie) {
      headers["Cookie"] = cookie;
    }
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    return headers;
  }

  /**
   * Parse a GoldPass URL to extract passId, linkVersion, and signature.
   */
  static parseUrl(url: string): ParsedGoldPassUrl {
    const parsed = new URL(url);
    const p = parsed.searchParams.get("p");
    const v = parsed.searchParams.get("v");
    const t = parsed.searchParams.get("t");

    if (!p || !t) {
      throw new Error("Thiếu tham số pass_id (?p=) hoặc signature (?t=) trong link GoldPass");
    }

    const linkVersion = v ? parseInt(v, 10) || 1 : 1;

    return {
      passId: p,
      linkVersion,
      signature: t,
    };
  }

  /**
   * Lấy thông tin phiên đối tác (username, cookie & csrf_token).
   * Hỗ trợ cả tài khoản thành viên (/api/v1/auth/me) lẫn tài khoản khách (/api/v1/guest/overview).
   */
  static async fetchSessionInfo(params: {
    cookie?: string;
    baseUrl?: string;
  }): Promise<{
    ok: boolean;
    username?: string;
    csrfToken?: string;
    cookie?: string;
    error?: string;
    rawPayload?: any;
  }> {
    const { cookie = "", baseUrl = DEFAULT_BASE_URL } = params;
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");

    try {
      // 1. Nếu có cookie, thử lấy thông tin tài khoản thành viên qua /api/v1/auth/me
      if (cookie && cookie.trim() !== "") {
        try {
          const authHeaders = this.getBrowserHeaders({
            baseUrl: cleanBaseUrl,
            cookie,
          });
          const authUrl = `${cleanBaseUrl}/api/v1/auth/me`;
          const authResponse = await fetch(authUrl, {
            method: "GET",
            headers: authHeaders,
            signal: AbortSignal.timeout(8000),
          });

          if (authResponse.status === 200) {
            const authPayload = await authResponse.json().catch(() => null);
            if (authPayload?.ok && authPayload?.data?.csrf_token) {
              return {
                ok: true,
                username: authPayload?.data?.username,
                csrfToken: authPayload?.data?.csrf_token,
                cookie,
                rawPayload: authPayload,
              };
            }
          }
        } catch {
          // Fallback sang guest/overview
        }
      }

      // 2. Fallback sang phiên khách /api/v1/guest/overview (tự động tạo hoặc tái sử dụng cookie khách)
      const guestHeaders = this.getBrowserHeaders({
        baseUrl: cleanBaseUrl,
        cookie: cookie || undefined,
      });
      const guestUrl = `${cleanBaseUrl}/api/v1/guest/overview`;
      const guestResponse = await fetch(guestUrl, {
        method: "GET",
        headers: guestHeaders,
        signal: AbortSignal.timeout(8000),
      });

      let guestPayload: any = null;
      try {
        guestPayload = await guestResponse.json();
      } catch {
        guestPayload = null;
      }

      let guestCookie = cookie;
      try {
        const setCookieHeader = guestResponse.headers?.get?.("set-cookie");
        if (setCookieHeader) {
          guestCookie = setCookieHeader.split(";")[0];
        }
      } catch {
        // Ignore header reading errors in test mocks
      }

      if (guestResponse.status === 200 && guestPayload?.ok && guestPayload?.data?.csrf_token) {
        return {
          ok: true,
          username: "Khách (Tự động)",
          csrfToken: guestPayload.data.csrf_token,
          cookie: guestCookie || undefined,
          rawPayload: guestPayload,
        };
      }

      return {
        ok: false,
        error: guestPayload?.message || `Lỗi xác thực phiên (${guestResponse.status})`,
        rawPayload: guestPayload,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || "Lỗi kết nối kiểm tra phiên",
      };
    }
  }

  /**
   * Test access to the GoldPass endpoint and verify credentials.
   */
  static async testAccess(params: {
    passId: string;
    linkVersion: number;
    signature: string;
    cookie?: string;
    baseUrl?: string;
  }): Promise<TestAccessResult> {
    const { passId, linkVersion, signature, cookie, baseUrl = DEFAULT_BASE_URL } = params;
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    const url = `${cleanBaseUrl}/api/v1/goldpass/access?p=${encodeURIComponent(
      passId
    )}&v=${encodeURIComponent(linkVersion)}&t=${encodeURIComponent(signature)}`;

    try {
      let activeCookie = cookie;
      let csrfToken: string | undefined;

      const session = await this.fetchSessionInfo({ cookie: activeCookie || "", baseUrl: cleanBaseUrl });
      if (session.ok) {
        csrfToken = session.csrfToken;
        if (!activeCookie && session.cookie) {
          activeCookie = session.cookie;
        }
      }

      const headers = this.getBrowserHeaders({
        baseUrl: cleanBaseUrl,
        passId,
        linkVersion,
        signature,
        cookie: activeCookie,
      });

      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(15000),
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (response.status === 200) {
        const data = payload?.data || {};
        let targetUsername =
          data?.subscription?.locket_username ||
          data?.locket?.username ||
          payload?.subscription?.locket_username ||
          payload?.locket?.username;
        const statusLabel = payload?.status_label || data?.status_label || data?.subscription?.status_label;
        const cooldownRemaining = data?.subscription?.cooldown_remaining ?? payload?.subscription?.cooldown_remaining ?? 0;

        if (!targetUsername && session.ok && session.username) {
          targetUsername = session.username;
        }

        return {
          ok: true,
          targetUsername,
          statusLabel,
          cooldownRemaining,
          csrfToken,
          cookie: activeCookie,
          rawPayload: payload,
        };
      }

      if (response.status === 401) {
        return {
          ok: false,
          error: "Phiên đăng nhập hết hạn (401)",
          rawPayload: payload,
        };
      }

      if (response.status === 403 && payload?.code === "origin_denied") {
        return {
          ok: false,
          error: "Nguồn truy cập không hợp lệ (Origin Denied). Đã tự động cập nhật tiêu đề trình duyệt.",
          rawPayload: payload,
        };
      }

      return {
        ok: false,
        error: payload?.message || "Lỗi truy cập GoldPass",
        rawPayload: payload,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || "Lỗi kết nối",
      };
    }
  }

  /**
   * Trigger pass activation on partner platform.
   */
  static async triggerUsePass(params: {
    passId: string;
    linkVersion: number;
    signature: string;
    cookie?: string;
    csrfToken?: string;
    baseUrl?: string;
  }): Promise<TriggerPassResult> {
    const { passId, linkVersion, signature, cookie, csrfToken, baseUrl = DEFAULT_BASE_URL } = params;
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    const url = `${cleanBaseUrl}/api/v1/goldpass/use`;
    const startTime = Date.now();

    try {
      let activeCsrfToken = csrfToken;
      let activeCookie = cookie;

      if (!activeCsrfToken || !activeCookie) {
        const session = await this.fetchSessionInfo({ cookie: activeCookie || "", baseUrl: cleanBaseUrl });
        if (session.ok) {
          if (!activeCsrfToken && session.csrfToken) {
            activeCsrfToken = session.csrfToken;
          }
          if (!activeCookie && session.cookie) {
            activeCookie = session.cookie;
          }
        }
      }

      const makeRequest = async (token?: string, c?: string) => {
        const headers = this.getBrowserHeaders({
          baseUrl: cleanBaseUrl,
          passId,
          linkVersion,
          signature,
          cookie: c,
          csrfToken: token,
        });
        headers["Content-Type"] = "application/json";

        const body = JSON.stringify({
          pass_id: passId,
          link_version: linkVersion,
          signature,
          idempotency_key: crypto.randomUUID(),
        });

        return fetch(url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(15000),
        });
      };

      let response = await makeRequest(activeCsrfToken, activeCookie);
      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      // Nếu lỗi csrf_failed hoặc 401, tự động tạo mới guest session và thử lại
      if ((response.status === 403 && payload?.code === "csrf_failed") || response.status === 401) {
        const refreshed = await this.fetchSessionInfo({ cookie: "", baseUrl: cleanBaseUrl });
        if (refreshed.ok && refreshed.csrfToken) {
          activeCsrfToken = refreshed.csrfToken;
          activeCookie = refreshed.cookie;
          response = await makeRequest(activeCsrfToken, activeCookie);
          try {
            payload = await response.json();
          } catch {
            payload = null;
          }
        }
      }

      const durationMs = Date.now() - startTime;

      if (response.status >= 200 && response.status < 300) {
        const jobId = payload?.data?.job?.job_id || payload?.data?.job_id || payload?.job?.job_id || payload?.job_id;
        return {
          ok: true,
          status: "SUCCESS",
          jobId,
          message: payload?.message || "Tiếp nhận yêu cầu thành công",
          durationMs,
          rawPayload: payload,
        };
      }

      if (response.status === 401) {
        return {
          ok: false,
          status: "SESSION_EXPIRED",
          message: "Phiên đăng nhập đối tác đã hết hạn. Vui lòng cập nhật Cookie mới.",
          durationMs,
          rawPayload: payload,
        };
      }

      if (response.status === 403) {
        if (payload?.code === "origin_denied") {
          return {
            ok: false,
            status: "FAILED",
            message: "Nguồn truy cập bị đối tác từ chối (Origin Denied).",
            durationMs,
            rawPayload: payload,
          };
        }
        if (payload?.code === "csrf_failed") {
          return {
            ok: false,
            status: "FAILED",
            message: "Phiên bảo mật CSRF không hợp lệ. Vui lòng kiểm tra Cookie mới.",
            durationMs,
            rawPayload: payload,
          };
        }
      }

      const messageStr = (payload?.message || "").toLowerCase();

      // Kiểm tra nếu thông báo cho biết đã đưa vào hàng chờ xử lý -> Xem là THÀNH CÔNG
      const isQueued =
        messageStr.includes("hàng chờ") ||
        messageStr.includes("hàng đợi") ||
        messageStr.includes("đưa vào") ||
        messageStr.includes("tiếp nhận") ||
        messageStr.includes("queue") ||
        messageStr.includes("đang xử lý");

      if (isQueued) {
        const jobId = payload?.data?.job?.job_id || payload?.data?.job_id || payload?.job?.job_id || payload?.job_id;
        return {
          ok: true,
          status: "SUCCESS",
          jobId,
          message: payload?.message || "Yêu cầu đã được đưa vào hàng chờ xử lý thành công",
          durationMs,
          rawPayload: payload,
        };
      }

      if (response.status === 400 || response.status === 429) {
        const hasCooldown =
          messageStr.includes("cooldown") ||
          messageStr.includes("chờ") ||
          messageStr.includes("đợi") ||
          payload?.cooldown_remaining != null ||
          payload?.data?.cooldown_remaining != null;

        if (hasCooldown) {
          return {
            ok: false,
            status: "COOLDOWN",
            message: payload?.message || "Đang trong thời gian chờ cooldown",
            durationMs,
            rawPayload: payload,
          };
        }

        return {
          ok: false,
          status: "FAILED",
          message: payload?.message || "Thao tác không thành công",
          durationMs,
          rawPayload: payload,
        };
      }

      return {
        ok: false,
        status: "FAILED",
        message: payload?.message || `Lỗi đối tác HTTP ${response.status}`,
        durationMs,
        rawPayload: payload,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      return {
        ok: false,
        status: "FAILED",
        message: err?.message || "Lỗi kết nối",
        durationMs,
      };
    }
  }
}
