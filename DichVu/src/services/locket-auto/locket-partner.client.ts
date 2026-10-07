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
    const url = `${baseUrl.replace(/\/+$/, "")}/api/v1/goldpass/access?p=${encodeURIComponent(
      passId
    )}&v=${encodeURIComponent(linkVersion)}&t=${encodeURIComponent(signature)}`;

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (cookie) {
        headers["Cookie"] = cookie;
      }

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
        const targetUsername =
          data?.subscription?.locket_username ||
          data?.locket?.username ||
          payload?.subscription?.locket_username ||
          payload?.locket?.username;
        const statusLabel = payload?.status_label || data?.status_label || data?.subscription?.status_label;
        const cooldownRemaining = data?.subscription?.cooldown_remaining ?? payload?.subscription?.cooldown_remaining ?? 0;

        return {
          ok: true,
          targetUsername,
          statusLabel,
          cooldownRemaining,
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
    const url = `${baseUrl.replace(/\/+$/, "")}/api/v1/goldpass/use`;
    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (cookie) {
        headers["Cookie"] = cookie;
      }
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }

      const body = JSON.stringify({
        pass_id: passId,
        link_version: linkVersion,
        signature,
        idempotency_key: crypto.randomUUID(),
      });

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(15000),
      });

      const durationMs = Date.now() - startTime;
      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

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
