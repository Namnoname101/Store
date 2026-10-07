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
   * Lấy thông tin phiên đăng nhập đối tác (username & csrf_token) qua /api/v1/auth/me
   */
  static async fetchSessionInfo(params: {
    cookie: string;
    baseUrl?: string;
  }): Promise<{
    ok: boolean;
    username?: string;
    csrfToken?: string;
    error?: string;
    rawPayload?: any;
  }> {
    const { cookie, baseUrl = DEFAULT_BASE_URL } = params;
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    const url = `${cleanBaseUrl}/api/v1/auth/me`;

    try {
      const headers = this.getBrowserHeaders({
        baseUrl: cleanBaseUrl,
        cookie,
      });

      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(10000),
      });

      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (response.status === 200 && payload?.ok) {
        return {
          ok: true,
          username: payload?.data?.username,
          csrfToken: payload?.data?.csrf_token,
          rawPayload: payload,
        };
      }

      return {
        ok: false,
        error: payload?.message || `Lỗi xác thực phiên (${response.status})`,
        rawPayload: payload,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || "Lỗi kết nối auth/me",
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
    cookie: string;
    baseUrl?: string;
  }): Promise<TestAccessResult> {
    const { passId, linkVersion, signature, cookie, baseUrl = DEFAULT_BASE_URL } = params;
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    const url = `${cleanBaseUrl}/api/v1/goldpass/access?p=${encodeURIComponent(
      passId
    )}&v=${encodeURIComponent(linkVersion)}&t=${encodeURIComponent(signature)}`;

    try {
      const headers = this.getBrowserHeaders({
        baseUrl: cleanBaseUrl,
        passId,
        linkVersion,
        signature,
        cookie,
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

        let csrfToken: string | undefined;
        if (cookie) {
          const session = await this.fetchSessionInfo({ cookie, baseUrl: cleanBaseUrl });
          if (session.ok) {
            csrfToken = session.csrfToken;
            if (!targetUsername && session.username) {
              targetUsername = session.username;
            }
          }
        }

        return {
          ok: true,
          targetUsername,
          statusLabel,
          cooldownRemaining,
          csrfToken,
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
    cookie: string;
    csrfToken?: string;
    baseUrl?: string;
  }): Promise<TriggerPassResult> {
    const { passId, linkVersion, signature, cookie, csrfToken, baseUrl = DEFAULT_BASE_URL } = params;
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    const url = `${cleanBaseUrl}/api/v1/goldpass/use`;
    const startTime = Date.now();

    try {
      let activeCsrfToken = csrfToken;
      if (!activeCsrfToken && cookie) {
        const session = await this.fetchSessionInfo({ cookie, baseUrl: cleanBaseUrl });
        if (session.ok && session.csrfToken) {
          activeCsrfToken = session.csrfToken;
        }
      }

      const makeRequest = async (token?: string) => {
        const headers = this.getBrowserHeaders({
          baseUrl: cleanBaseUrl,
          passId,
          linkVersion,
          signature,
          cookie,
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

      let response = await makeRequest(activeCsrfToken);
      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      // Nếu lỗi csrf_failed, thử làm mới csrfToken một lần và thử lại
      if (response.status === 403 && payload?.code === "csrf_failed" && cookie) {
        const refreshed = await this.fetchSessionInfo({ cookie, baseUrl: cleanBaseUrl });
        if (refreshed.ok && refreshed.csrfToken && refreshed.csrfToken !== activeCsrfToken) {
          activeCsrfToken = refreshed.csrfToken;
          response = await makeRequest(activeCsrfToken);
          try {
            payload = await response.json();
          } catch {
            payload = null;
          }
        }
      }

      const durationMs = Date.now() - startTime;

      if (response.status === 200) {
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

      if (response.status === 400 || response.status === 429) {
        const messageStr = (payload?.message || "").toLowerCase();
        const hasCooldown =
          messageStr.includes("cooldown") ||
          messageStr.includes("chờ") ||
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
