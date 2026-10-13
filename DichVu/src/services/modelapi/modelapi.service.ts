import { prisma, TopupStatus, UpstreamStatus } from "@/lib/prisma";
import { acquireTokenLock } from "./token-mutex";

export interface ApplyQuotaTopupParams {
  bindingId: string;
  orderId: string;
  creditUsd: number;
  upstreamTokenId: number;
  performedBy?: string;
}

export interface ApplyQuotaTopupResult {
  success: boolean;
  quotaBefore: number;
  quotaAdded: number;
  quotaAfter: number;
  discrepancyDelta: number;
  error?: string;
}

export interface VerifyCustomerKeyResult {
  valid: boolean;
  tokenId?: number;
  name?: string;
  remainQuota?: number;
  unlimitedQuota?: boolean;
  error?: string;
}

export interface ConnectionCheckResult {
  success: boolean;
  quota: number;
  usedQuota: number;
  balanceUsd: number;
}

export class ModelApiService {
  private static getBaseUrl(): string {
    return process.env.MODELAPI_BASE_URL || "https://modelapi.vn";
  }

  private static getSystemToken(): string {
    return process.env.MODELAPI_SYSTEM_ACCESS_TOKEN || "";
  }

  private static getQuotaPerUsd(): number {
    const val = Number(process.env.MODELAPI_QUOTA_PER_USD);
    return val > 0 ? val : 500000;
  }

  private static getTimeoutMs(): number {
    return Number(process.env.MODELAPI_TIMEOUT_MS) || 10000;
  }

  /**
   * Converts USD to upstream ModelAPI quota units.
   * Default: 1 USD = 500,000 quota units.
   */
  static usdToQuota(usd: number): number {
    return Math.round(usd * this.getQuotaPerUsd());
  }

  /**
   * Converts upstream ModelAPI quota units to equivalent USD.
   */
  static quotaToUsd(quota: number): number {
    const rate = this.getQuotaPerUsd();
    if (!rate || rate <= 0) return 0;
    return Number((quota / rate).toFixed(4));
  }

  /**
   * Checks upstream ModelAPI connection and system account balance.
   */
  static async checkConnection(): Promise<ConnectionCheckResult> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.getTimeoutMs());

      const res = await fetch(`${this.getBaseUrl()}/api/user/self`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getSystemToken()}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        return { success: false, quota: 0, usedQuota: 0, balanceUsd: 0 };
      }

      const json = await res.json();
      if (!json?.success || !json?.data) {
        return { success: false, quota: 0, usedQuota: 0, balanceUsd: 0 };
      }

      const quota = Number(json.data.quota || 0);
      const usedQuota = Number(json.data.used_quota || 0);
      return {
        success: true,
        quota,
        usedQuota,
        balanceUsd: this.quotaToUsd(quota),
      };
    } catch {
      return { success: false, quota: 0, usedQuota: 0, balanceUsd: 0 };
    }
  }

  /**
   * Fetches the total source balance & usage overview of the master account.
   */
  static async fetchSourceBalance(): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.getTimeoutMs());

    try {
      const res = await fetch(`${this.getBaseUrl()}/api/user/self`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getSystemToken()}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      const json = await res.json();
      if (!res.ok || !json?.success) {
        return {
          success: false,
          quota: 0,
          usedQuota: 0,
          balanceUsd: 0,
          error: json?.message || "Failed to fetch source balance",
        };
      }

      const quota = Number(json.data?.quota || 0);
      const usedQuota = Number(json.data?.used_quota || 0);

      return {
        success: true,
        quota,
        usedQuota,
        balanceUsd: this.quotaToUsd(quota),
        raw: json.data,
      };
    } catch (err: any) {
      clearTimeout(timer);
      return {
        success: false,
        quota: 0,
        usedQuota: 0,
        balanceUsd: 0,
        error: err.message || "Network error fetching source balance",
      };
    }
  }

  /**
   * Redeems a gift/redemption card code into the master account on ModelAPI to replenish master quota.
   */
  static async redeemMasterAccount(
    redemptionCode: string
  ): Promise<{ success: boolean; message?: string; quota?: number }> {
    if (!redemptionCode || !redemptionCode.trim()) {
      return { success: false, message: "Redemption code cannot be empty" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.getTimeoutMs());

    try {
      const res = await fetch(`${this.getBaseUrl()}/api/user/topup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getSystemToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: redemptionCode.trim() }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        return {
          success: false,
          message: json?.message || `Redeem failed: HTTP ${res.status}`,
        };
      }

      return {
        success: true,
        message: json?.message || "Nạp thẻ thành công vào tài khoản tổng",
        quota: json?.data?.quota,
      };
    } catch (err: any) {
      clearTimeout(timer);
      return {
        success: false,
        message: err.message || "Network error while redeeming code on ModelAPI",
      };
    }
  }

  /**
   * Verifies that customer API key exists, is active, and returns its metadata.
   */
  static async verifyCustomerKey(apiKey: string): Promise<VerifyCustomerKeyResult> {
    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return { valid: false, error: "API Key must be provided" };
    }

    try {
      // Step 1: Probe key status via token-scoped usage endpoint
      const controller1 = new AbortController();
      const timer1 = setTimeout(() => controller1.abort(), this.getTimeoutMs());

      const probeRes = await fetch(`${this.getBaseUrl()}/api/usage/token`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        signal: controller1.signal,
      });

      clearTimeout(timer1);

      if (!probeRes.ok) {
        return { valid: false, error: "API Key không hợp lệ hoặc đã bị vô hiệu hóa trên upstream" };
      }

      const probeJson = await probeRes.json();
      const probeData = probeJson?.data;
      const totalAvailable =
        typeof probeData === "number"
          ? probeData
          : (probeData?.total_available ?? probeData?.quota ?? 0);
      const tokenName = typeof probeData === "object" ? probeData?.name : undefined;

      let token: any = null;

      // Step 2: Query token details from upstream master account if system token is configured
      if (this.getSystemToken()) {
        try {
          const controller2 = new AbortController();
          const timer2 = setTimeout(() => controller2.abort(), this.getTimeoutMs());

          // Search by tokenName if available, else by key
          const keyword = tokenName || apiKey.trim();
          const searchRes = await fetch(
            `${this.getBaseUrl()}/api/token/search?keyword=${encodeURIComponent(keyword)}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${this.getSystemToken()}`,
              },
              signal: controller2.signal,
            }
          );

          clearTimeout(timer2);

          if (searchRes.ok) {
            const searchJson = await searchRes.json();
            const items = Array.isArray(searchJson?.data)
              ? searchJson.data
              : Array.isArray(searchJson?.data?.items)
              ? searchJson.data.items
              : [];
            if (items.length > 0) {
              token =
                items.find(
                  (t: any) =>
                    (t.key && (apiKey.trim().includes(t.key.replace(/\*/g, "")) || t.key.includes(apiKey.trim().substring(0, 4)))) ||
                    (tokenName && t.name === tokenName)
                ) || items[0];
            }
          }
        } catch {
          // Non-blocking fallback to probe data
        }
      }

      // Status in New API: 1 = Active, 2 = Disabled
      if (token && token.status !== 1) {
        return { valid: false, error: "API Key is disabled or inactive upstream" };
      }

      return {
        valid: true,
        tokenId: token?.id || undefined,
        name: token?.name || tokenName || "API Key",
        remainQuota: token?.remain_quota ?? totalAvailable,
        unlimitedQuota: Boolean(
          token?.unlimited_quota ?? (typeof probeData === "object" ? probeData?.unlimited_quota : false)
        ),
      };
    } catch (err: any) {
      return { valid: false, error: err.message || "Failed to verify API Key" };
    }
  }

  /**
   * Applies quota topup with in-process mutex lock, upstream delta reconciliation,
   * CreditLedger entry recording, and status transitions.
   */
  static async applyQuotaTopup(params: ApplyQuotaTopupParams): Promise<ApplyQuotaTopupResult> {
    const quotaAdded = this.usdToQuota(params.creditUsd);
    let quotaBefore = 0;

    // Acquire FIFO mutex lock for upstreamTokenId
    const unlock = await acquireTokenLock(params.upstreamTokenId);

    try {
      // 1. Mark topup order as PROCESSING if present
      await prisma.creditTopupOrder
        .updateMany({
          where: { orderId: params.orderId },
          data: { status: TopupStatus.PROCESSING },
        })
        .catch(() => {});

      // 2. Read snapshot quotaBefore from upstream GET /api/token/{id}
      let resolvedTokenId = params.upstreamTokenId;
      const fetchBeforeController = new AbortController();
      const timerBefore = setTimeout(() => fetchBeforeController.abort(), this.getTimeoutMs());

      let getBeforeRes = await fetch(
        `${this.getBaseUrl()}/api/token/${resolvedTokenId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.getSystemToken()}`,
          },
          signal: fetchBeforeController.signal,
        }
      );

      clearTimeout(timerBefore);

      let beforeJson = await getBeforeRes.json().catch(() => null);

      // Self-heal: if token not found by ID (e.g. HTTP error or record not found), look up by keyName
      if ((!getBeforeRes.ok || !beforeJson?.success || !beforeJson?.data) && params.bindingId) {
        try {
          const binding = await prisma.customerApiKeyBinding.findUnique({
            where: { id: params.bindingId },
          });
          if (binding?.keyName) {
            const searchRes = await fetch(
              `${this.getBaseUrl()}/api/token/search?keyword=${encodeURIComponent(binding.keyName)}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${this.getSystemToken()}`,
                },
              }
            );
            if (searchRes.ok) {
              const searchJson = await searchRes.json();
              const items = Array.isArray(searchJson?.data)
                ? searchJson.data
                : Array.isArray(searchJson?.data?.items)
                ? searchJson.data.items
                : [];
              const found = items.find((t: any) => t.name === binding.keyName) || items[0];
              if (found?.id) {
                resolvedTokenId = found.id;
                await prisma.customerApiKeyBinding.update({
                  where: { id: params.bindingId },
                  data: { upstreamTokenId: found.id },
                }).catch(() => {});

                getBeforeRes = await fetch(
                  `${this.getBaseUrl()}/api/token/${resolvedTokenId}`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${this.getSystemToken()}`,
                    },
                  }
                );
                if (getBeforeRes.ok) {
                  beforeJson = await getBeforeRes.json().catch(() => null);
                }
              }
            }
          }
        } catch {
          // Ignore lookup error, let following check handle failure
        }
      }

      if (!getBeforeRes.ok) {
        throw new Error(
          `Failed to read quotaBefore from upstream: HTTP ${getBeforeRes.status} ${getBeforeRes.statusText}`
        );
      }

      if (!beforeJson?.success || !beforeJson?.data) {
        throw new Error(`Invalid response format when reading quotaBefore: ${beforeJson?.message || "Unknown error"}`);
      }

      const tokenData = beforeJson.data;
      quotaBefore = Number(tokenData.remain_quota || 0);

      // 3. Compute target quota
      const targetQuota = quotaBefore + quotaAdded;

      // 4. Update upstream token with PUT /api/token/
      const putController = new AbortController();
      const timerPut = setTimeout(() => putController.abort(), this.getTimeoutMs());

      const putRes = await fetch(`${this.getBaseUrl()}/api/token/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.getSystemToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...tokenData,
          id: resolvedTokenId,
          remain_quota: targetQuota,
        }),
        signal: putController.signal,
      });

      clearTimeout(timerPut);

      if (!putRes.ok) {
        throw new Error(`Upstream PUT failed: HTTP ${putRes.status} ${putRes.statusText}`);
      }

      // 5. Read snapshot quotaAfter from upstream GET /api/token/{id}
      const fetchAfterController = new AbortController();
      const timerAfter = setTimeout(() => fetchAfterController.abort(), this.getTimeoutMs());

      const getAfterRes = await fetch(
        `${this.getBaseUrl()}/api/token/${resolvedTokenId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.getSystemToken()}`,
          },
          signal: fetchAfterController.signal,
        }
      );

      clearTimeout(timerAfter);

      if (!getAfterRes.ok) {
        throw new Error(
          `Failed to read quotaAfter from upstream: HTTP ${getAfterRes.status} ${getAfterRes.statusText}`
        );
      }

      const afterJson = await getAfterRes.json();
      const quotaAfter = Number(afterJson?.data?.remain_quota ?? targetQuota);

      // 6. Calculate discrepancy delta (consumed by AI models during update window)
      const discrepancyDelta = Math.max(0, targetQuota - quotaAfter);

      // 7. Atomic DB updates via Prisma transaction
      await prisma.$transaction(async (tx) => {
        const topupOrder = await tx.creditTopupOrder.findFirst({
          where: { orderId: params.orderId },
        });

        // Record CreditLedger entry
        await tx.creditLedger.create({
          data: {
            bindingId: params.bindingId,
            topupOrderId: topupOrder?.id,
            upstreamTokenId: params.upstreamTokenId,
            quotaBefore,
            quotaAddedExpected: quotaAdded,
            quotaAfterReported: quotaAfter,
            discrepancyDelta,
            performedBy: params.performedBy || "SYSTEM",
            note:
              discrepancyDelta > 0
                ? `Topup reconciled with ${discrepancyDelta} quota consumed during transaction`
                : "Topup completed successfully",
          },
        });

        // Update CreditTopupOrder
        if (topupOrder) {
          await tx.creditTopupOrder.update({
            where: { id: topupOrder.id },
            data: {
              status: TopupStatus.COMPLETED,
              completedAt: new Date(),
              errorMessage: null,
            },
          });
        }

        // Update CustomerApiKeyBinding
        await tx.customerApiKeyBinding.update({
          where: { id: params.bindingId },
          data: {
            totalCreditUsd: { increment: params.creditUsd },
            lastSyncedAt: new Date(),
          },
        });

        // Update Order upstream status if exists
        await tx.order
          .update({
            where: { id: params.orderId },
            data: { upstreamStatus: UpstreamStatus.COMPLETED },
          })
          .catch(() => {});
      });

      return {
        success: true,
        quotaBefore,
        quotaAdded,
        quotaAfter,
        discrepancyDelta,
      };
    } catch (err: any) {
      // Mark CreditTopupOrder as RECONCILE_REQUIRED on network or unexpected failures
      await prisma.creditTopupOrder
        .updateMany({
          where: { orderId: params.orderId },
          data: {
            status: TopupStatus.RECONCILE_REQUIRED,
            errorMessage: err.message || "Unknown error during quota topup",
          },
        })
        .catch(() => {});

      return {
        success: false,
        quotaBefore,
        quotaAdded,
        quotaAfter: 0,
        discrepancyDelta: 0,
        error: err.message || "Topup failed",
      };
    } finally {
      // Release lock for other pending topups
      unlock();
    }
  }

  /**
   * Fetches customer token quota usage overview using customer's personal API Key.
   */
  static async fetchTokenUsage(apiKey: string): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.getTimeoutMs());

    try {
      const res = await fetch(`${this.getBaseUrl()}/api/usage/token`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  /**
   * Fetches customer token request history logs using customer's personal API Key.
   */
  static async fetchTokenLogs(apiKey: string, page: number = 1, pageSize: number = 20): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.getTimeoutMs());

    try {
      const res = await fetch(
        `${this.getBaseUrl()}/api/log/token?p=${page}&page_size=${pageSize}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timer);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  /**
   * Fetches token details by token ID using master system token.
   */
  static async fetchTokenById(tokenId: number): Promise<any> {
    if (!this.getSystemToken()) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.getTimeoutMs());

    try {
      const res = await fetch(`${this.getBaseUrl()}/api/token/${tokenId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getSystemToken()}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      return null;
    }
  }
}
