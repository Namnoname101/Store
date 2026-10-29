import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest";
import { ModelApiService } from "@/services/modelapi/modelapi.service";
import { acquireTokenLock } from "@/services/modelapi/token-mutex";
import { prisma, TopupStatus } from "@/lib/prisma";

describe("ModelApiService & TokenMutex Tests", () => {
  const createdBindingIds: string[] = [];
  const createdOrderIds: string[] = [];

  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.MODELAPI_BASE_URL = "https://mock.modelapi.vn";
    process.env.MODELAPI_SYSTEM_ACCESS_TOKEN = "sys_test_secret_token_123";
    process.env.MODELAPI_QUOTA_PER_USD = "500000";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    for (const id of createdBindingIds) {
      await prisma.creditLedger.deleteMany({ where: { bindingId: id } }).catch(() => {});
      await prisma.creditTopupOrder.deleteMany({ where: { bindingId: id } }).catch(() => {});
      await prisma.customerApiKeyBinding.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdOrderIds) {
      await prisma.creditTopupOrder.deleteMany({ where: { orderId: id } }).catch(() => {});
      await prisma.order.delete({ where: { id } }).catch(() => {});
    }
  });

  describe("1. Currency and Quota Conversion Units", () => {
    it("should convert USD to quota units accurately", () => {
      expect(ModelApiService.usdToQuota(1)).toBe(500000);
      expect(ModelApiService.usdToQuota(10)).toBe(5000000);
      expect(ModelApiService.usdToQuota(20.5)).toBe(10250000);
      expect(ModelApiService.usdToQuota(0)).toBe(0);
    });

    it("should convert quota units to USD accurately", () => {
      expect(ModelApiService.quotaToUsd(500000)).toBe(1);
      expect(ModelApiService.quotaToUsd(5000000)).toBe(10);
      expect(ModelApiService.quotaToUsd(250000)).toBe(0.5);
      expect(ModelApiService.quotaToUsd(0)).toBe(0);
    });

    it("should respect custom MODELAPI_QUOTA_PER_USD env override", () => {
      process.env.MODELAPI_QUOTA_PER_USD = "1000000";
      expect(ModelApiService.usdToQuota(5)).toBe(5000000);
      expect(ModelApiService.quotaToUsd(5000000)).toBe(5);
    });
  });

  describe("2. In-Process Token Mutex Lock", () => {
    it("should serialize concurrent lock requests for the exact same token ID", async () => {
      const tokenId = 999101;
      const executionOrder: string[] = [];

      const unlock1 = await acquireTokenLock(tokenId);
      executionOrder.push("lock1-acquired");

      const lock2Promise = acquireTokenLock(tokenId).then((unlock2) => {
        executionOrder.push("lock2-acquired");
        unlock2();
      });

      // Allow microtasks to execute: lock2 should still be waiting
      await new Promise((r) => setTimeout(r, 20));
      expect(executionOrder).toEqual(["lock1-acquired"]);

      unlock1();
      await lock2Promise;
      expect(executionOrder).toEqual(["lock1-acquired", "lock2-acquired"]);
    });

    it("should allow independent locks on different token IDs concurrently", async () => {
      const tokenA = 11101;
      const tokenB = 22202;

      const unlockA = await acquireTokenLock(tokenA);
      let tokenBAcquired = false;

      const unlockB = await acquireTokenLock(tokenB);
      tokenBAcquired = true;

      expect(tokenBAcquired).toBe(true);
      unlockA();
      unlockB();
    });

    it("should timeout when lock cannot be acquired within timeoutMs", async () => {
      const tokenId = 777123;
      const unlock1 = await acquireTokenLock(tokenId);

      await expect(acquireTokenLock(tokenId, 50)).rejects.toThrow(/timeout/i);
      unlock1();
    });
  });

  describe("3. Upstream checkConnection and fetchSourceBalance", () => {
    it("should return connection status and source balance on success", async () => {
      const mockUserResponse = {
        success: true,
        data: {
          quota: 250000000,
          used_quota: 50000000,
          username: "admin_daitruong",
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUserResponse,
      } as any);

      const conn = await ModelApiService.checkConnection();
      expect(conn.success).toBe(true);
      expect(conn.quota).toBe(250000000);
      expect(conn.usedQuota).toBe(50000000);
      expect(conn.balanceUsd).toBe(500); // 250,000,000 / 500,000

      const balance = await ModelApiService.fetchSourceBalance();
      expect(balance.success).toBe(true);
      expect(balance.quota).toBe(250000000);
      expect(balance.balanceUsd).toBe(500);
    });

    it("should handle upstream error gracefully in checkConnection", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ success: false, message: "Invalid system token" }),
      } as any);

      const conn = await ModelApiService.checkConnection();
      expect(conn.success).toBe(false);
      expect(conn.quota).toBe(0);
      expect(conn.balanceUsd).toBe(0);
    });
  });

  describe("4. verifyCustomerKey", () => {
    it("should verify valid active customer key and return token details", async () => {
      const testApiKey = "sk-valid-customer-key-999";

      globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        const urlStr = url.toString();
        // Probe usage endpoint
        if (urlStr.includes("/api/usage/token")) {
          expect(init?.headers).toMatchObject({
            Authorization: `Bearer ${testApiKey}`,
          });
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: 1500000 }),
          });
        }
        // Search token endpoint
        if (urlStr.includes("/api/token/search")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: [
                {
                  id: 88412,
                  name: "Khach Hang VIP 1",
                  key: testApiKey,
                  status: 1, // Active
                  remain_quota: 1500000,
                  unlimited_quota: false,
                },
              ],
            }),
          });
        }
        return Promise.reject(new Error("Unexpected url: " + urlStr));
      });

      const res = await ModelApiService.verifyCustomerKey(testApiKey);
      expect(res.valid).toBe(true);
      expect(res.tokenId).toBe(88412);
      expect(res.name).toBe("Khach Hang VIP 1");
      expect(res.remainQuota).toBe(1500000);
      expect(res.unlimitedQuota).toBe(false);
    });

    it("should return invalid if key fails usage probe (invalid key or 401)", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, message: "Invalid API key" }),
      } as any);

      const res = await ModelApiService.verifyCustomerKey("sk-invalid-fake");
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });

    it("should return invalid if token is disabled/suspended (status !== 1)", async () => {
      const testApiKey = "sk-disabled-customer-key";

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        const urlStr = url.toString();
        if (urlStr.includes("/api/usage/token")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: 0 }),
          });
        }
        if (urlStr.includes("/api/token/search")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: [
                {
                  id: 88413,
                  name: "Khach Hang Disabled",
                  key: testApiKey,
                  status: 2, // Disabled
                  remain_quota: 0,
                },
              ],
            }),
          });
        }
        return Promise.reject(new Error("Unexpected url: " + urlStr));
      });

      const res = await ModelApiService.verifyCustomerKey(testApiKey);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/disabled|inactive/i);
    });
  });

  describe("5. applyQuotaTopup with Delta Reconciliation and Ledger", () => {
    it("should successfully apply quota topup with 0 discrepancy delta and record CreditLedger", async () => {
      // 1. Setup DB binding and order
      const upstreamTokenId = 555001;
      const binding = await prisma.customerApiKeyBinding.create({
        data: {
          upstreamTokenId,
          keyFingerprint: "fp_apply_test_" + Date.now(),
          maskedKey: "sk-topup...001",
          keyName: "Test Topup Customer",
          totalCreditUsd: 0,
        },
      });
      createdBindingIds.push(binding.id);

      const order = await prisma.order.create({
        data: {
          orderCode: "ORD_TOPUP_" + Date.now(),
          totalAmount: 250000,
          expiresAt: new Date(Date.now() + 600000),
        },
      });
      createdOrderIds.push(order.id);

      const topupOrder = await prisma.creditTopupOrder.create({
        data: {
          orderId: order.id,
          bindingId: binding.id,
          creditUsd: 10.0,
          quotaUnits: 5000000,
          status: TopupStatus.PENDING,
        },
      });

      // 2. Mock upstream New API:
      // - GET /api/token/555001 -> quotaBefore = 1,000,000
      // - PUT /api/token/ -> updates remain_quota to 6,000,000
      // - GET /api/token/555001 -> quotaAfter = 6,000,000
      let currentQuota = 1000000;
      globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        const urlStr = url.toString();
        const method = init?.method || "GET";

        if (urlStr.includes(`/api/token/${upstreamTokenId}`) && method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                id: upstreamTokenId,
                name: "Test Topup Customer",
                remain_quota: currentQuota,
              },
            }),
          });
        }

        if (urlStr.includes("/api/token") && method === "PUT") {
          const body = JSON.parse(init?.body as string);
          currentQuota = body.remain_quota;
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                id: upstreamTokenId,
                remain_quota: currentQuota,
              },
            }),
          });
        }

        return Promise.reject(new Error("Unexpected request: " + method + " " + urlStr));
      });

      // 3. Execute topup
      const result = await ModelApiService.applyQuotaTopup({
        bindingId: binding.id,
        orderId: order.id,
        creditUsd: 10.0,
        upstreamTokenId,
        performedBy: "SYSTEM",
      });

      expect(result.success).toBe(true);
      expect(result.quotaBefore).toBe(1000000);
      expect(result.quotaAdded).toBe(5000000);
      expect(result.quotaAfter).toBe(6000000);
      expect(result.discrepancyDelta).toBe(0);

      // 4. Verify DB state: CreditLedger row exists
      const ledger = await prisma.creditLedger.findFirst({
        where: { bindingId: binding.id, upstreamTokenId },
      });
      expect(ledger).toBeDefined();
      expect(ledger?.quotaBefore).toBe(1000000);
      expect(ledger?.quotaAddedExpected).toBe(5000000);
      expect(ledger?.quotaAfterReported).toBe(6000000);
      expect(ledger?.discrepancyDelta).toBe(0);

      // 5. Verify CreditTopupOrder completed
      const updatedOrder = await prisma.creditTopupOrder.findUnique({
        where: { id: topupOrder.id },
      });
      expect(updatedOrder?.status).toBe(TopupStatus.COMPLETED);
      expect(updatedOrder?.completedAt).toBeDefined();

      // 6. Verify CustomerApiKeyBinding totalCreditUsd incremented
      const updatedBinding = await prisma.customerApiKeyBinding.findUnique({
        where: { id: binding.id },
      });
      expect(updatedBinding?.totalCreditUsd).toBe(10.0);
    });

    it("should reconcile AI consumption during topup and record positive discrepancyDelta", async () => {
      const upstreamTokenId = 555002;
      const binding = await prisma.customerApiKeyBinding.create({
        data: {
          upstreamTokenId,
          keyFingerprint: "fp_apply_delta_" + Date.now(),
          maskedKey: "sk-topup...002",
          keyName: "Delta Customer",
        },
      });
      createdBindingIds.push(binding.id);

      const order = await prisma.order.create({
        data: {
          orderCode: "ORD_DELTA_" + Date.now(),
          totalAmount: 125000,
          expiresAt: new Date(Date.now() + 600000),
        },
      });
      createdOrderIds.push(order.id);

      await prisma.creditTopupOrder.create({
        data: {
          orderId: order.id,
          bindingId: binding.id,
          creditUsd: 5.0,
          quotaUnits: 2500000,
          status: TopupStatus.PENDING,
        },
      });

      // Target = 1,000,000 + 2,500,000 = 3,500,000
      // But AI consumed 40,000 during the update window, so quotaAfter = 3,460,000
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        const method = init?.method || "GET";
        if (method === "GET") {
          callCount++;
          const quota = callCount === 1 ? 1000000 : 3460000;
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: { id: upstreamTokenId, remain_quota: quota },
            }),
          });
        }
        if (method === "PUT") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: { id: upstreamTokenId } }),
          });
        }
        return Promise.reject(new Error("Unexpected"));
      });

      const result = await ModelApiService.applyQuotaTopup({
        bindingId: binding.id,
        orderId: order.id,
        creditUsd: 5.0,
        upstreamTokenId,
      });

      expect(result.success).toBe(true);
      expect(result.quotaBefore).toBe(1000000);
      expect(result.quotaAdded).toBe(2500000);
      expect(result.quotaAfter).toBe(3460000);
      expect(result.discrepancyDelta).toBe(40000); // 3,500,000 - 3,460,000

      const ledger = await prisma.creditLedger.findFirst({
        where: { bindingId: binding.id },
      });
      expect(ledger?.discrepancyDelta).toBe(40000);
    });

    it("should set CreditTopupOrder to RECONCILE_REQUIRED when upstream network error occurs", async () => {
      const upstreamTokenId = 555003;
      const binding = await prisma.customerApiKeyBinding.create({
        data: {
          upstreamTokenId,
          keyFingerprint: "fp_apply_err_" + Date.now(),
          maskedKey: "sk-topup...003",
        },
      });
      createdBindingIds.push(binding.id);

      const order = await prisma.order.create({
        data: {
          orderCode: "ORD_ERR_" + Date.now(),
          totalAmount: 250000,
          expiresAt: new Date(Date.now() + 600000),
        },
      });
      createdOrderIds.push(order.id);

      const topupOrder = await prisma.creditTopupOrder.create({
        data: {
          orderId: order.id,
          bindingId: binding.id,
          creditUsd: 10.0,
          quotaUnits: 5000000,
          status: TopupStatus.PENDING,
        },
      });

      // Simulate failure on PUT
      globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        const method = init?.method || "GET";
        if (method === "GET") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: { remain_quota: 500000 } }),
          });
        }
        return Promise.reject(new Error("Network timeout contacting modelapi.vn"));
      });

      const result = await ModelApiService.applyQuotaTopup({
        bindingId: binding.id,
        orderId: order.id,
        creditUsd: 10.0,
        upstreamTokenId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/timeout/i);

      const updated = await prisma.creditTopupOrder.findUnique({
        where: { id: topupOrder.id },
      });
      expect(updated?.status).toBe(TopupStatus.RECONCILE_REQUIRED);
      expect(updated?.errorMessage).toMatch(/timeout/i);
    });
  });

  describe("6. Token-Scoped Developer Usage and Logs", () => {
    it("should fetch token usage successfully using customer API key", async () => {
      const testKey = "sk-dev-token-usage-key";
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            total_granted: 10000000,
            total_used: 2500000,
            total_available: 7500000,
          },
        }),
      } as any);

      const usage = await ModelApiService.fetchTokenUsage(testKey);
      expect(usage).toBeDefined();
      expect(usage.data.total_available).toBe(7500000);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://mock.modelapi.vn/api/usage/token",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${testKey}`,
          }),
        })
      );
    });

    it("should fetch token logs with pagination using customer API key", async () => {
      const testKey = "sk-dev-token-logs-key";
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [
            {
              id: 1,
              model_name: "claude-3-5-sonnet-20241022",
              prompt_tokens: 120,
              completion_tokens: 350,
              quota: 1200,
              created_at: 1728700000,
            },
          ],
        }),
      } as any);

      const logs = await ModelApiService.fetchTokenLogs(testKey, 2, 25);
      expect(logs).toBeDefined();
      expect(logs.data).toHaveLength(1);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://mock.modelapi.vn/api/log/token?p=2&page_size=25",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${testKey}`,
          }),
        })
      );
    });
  });

  describe("7. Automatic Key Creation (createCustomerKey)", () => {
    it("should successfully create token on ModelAPI and create CustomerApiKeyBinding", async () => {
      globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (init?.method === "POST" && url.includes("/api/token/")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                id: 887766,
                key: "sk-mock-auto-key-test-887766",
                name: "DaiTruong_TestOrder",
                remain_quota: 5000000,
              },
            }),
          });
        }
        return Promise.reject(new Error("Unexpected endpoint"));
      });

      const res = await ModelApiService.createCustomerKey({
        creditUsd: 10,
        name: "DaiTruong_TestOrder",
        guestEmail: "testguest@daitruong.com",
      });

      expect(res.success).toBe(true);
      expect(res.key).toBe("sk-mock-auto-key-test-887766");
      expect(res.maskedKey).toBe("sk-mock...7766");
      expect(res.bindingId).toBeDefined();

      if (res.bindingId) {
        createdBindingIds.push(res.bindingId);
        const bindingInDb = await prisma.customerApiKeyBinding.findUnique({
          where: { id: res.bindingId },
        });
        expect(bindingInDb).toBeDefined();
        expect(bindingInDb?.upstreamTokenId).toBe(887766);
        expect(bindingInDb?.totalCreditUsd).toBe(10);
      }
    });

    it("should return error when upstream token creation fails", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: "Master account insufficient balance",
        }),
      } as any);

      const res = await ModelApiService.createCustomerKey({
        creditUsd: 50,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("insufficient balance");
    });
  });
});
