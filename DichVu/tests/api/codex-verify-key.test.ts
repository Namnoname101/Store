import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from "vitest";
import prisma from "@/lib/prisma";
import { POST as verifyKeyHandler } from "@/app/api/codex/verify-key/route";
import { GET as myKeysHandler } from "@/app/api/codex/my-keys/route";
import { computeKeyFingerprint, maskApiKey } from "@/lib/key-security";
import { ModelApiService } from "@/services/modelapi/modelapi.service";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-auth";
import { NextRequest } from "next/server";

describe("Codex Key Verification & Binding API Endpoints", () => {
  const testBindingIds: string[] = [];
  const testUserIds: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    for (const id of testBindingIds) {
      await prisma.customerApiKeyBinding.delete({ where: { id } }).catch(() => {});
    }
    for (const id of testUserIds) {
      await prisma.user.delete({ where: { id } }).catch(() => {});
    }
  });

  describe("1. Key Security Utilities (HMAC & Masking)", () => {
    it("should compute deterministic HMAC-SHA256 fingerprint", () => {
      const key = "sk-test-secret-key-123456";
      const fp1 = computeKeyFingerprint(key);
      const fp2 = computeKeyFingerprint("  " + key + "  ");
      const fpOther = computeKeyFingerprint("sk-different-key-999");

      expect(fp1).toBeDefined();
      expect(typeof fp1).toBe("string");
      expect(fp1.length).toBe(64); // SHA-256 produces 64 hex chars
      expect(fp1).toBe(fp2); // Trimming whitespace handled
      expect(fp1).not.toBe(fpOther);
    });

    it("should mask API keys cleanly for UI display", () => {
      expect(maskApiKey("sk-1234567890abcdef")).toBe("sk-1234...cdef");
      expect(maskApiKey("sk-ant-api03-secret1234")).toBe("sk-ant-...1234");
      expect(maskApiKey("short")).toBe("****");
      expect(maskApiKey("")).toBe("");
    });
  });

  describe("2. POST /api/codex/verify-key - Format & Upstream Validation", () => {
    it("should reject missing or non-string API key with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/codex/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await verifyKeyHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("should reject key with invalid prefix or length < 10 with 400", async () => {
      // Key not starting with sk-
      const req1 = new NextRequest("http://localhost:3000/api/codex/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "invalid-key" }),
      });
      const res1 = await verifyKeyHandler(req1);
      expect(res1.status).toBe(400);

      // Key starting with sk- but too short
      const req2 = new NextRequest("http://localhost:3000/api/codex/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "sk-short" }),
      });
      const res2 = await verifyKeyHandler(req2);
      expect(res2.status).toBe(400);
    });

    it("should return 400 if upstream ModelApiService rejects key", async () => {
      vi.spyOn(ModelApiService, "verifyCustomerKey").mockResolvedValue({
        valid: false,
        error: "API Key is disabled or inactive upstream",
      });

      const req = new NextRequest("http://localhost:3000/api/codex/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "sk-inactive-token-0000000" }),
      });

      const res = await verifyKeyHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("disabled or inactive");
    });
  });

  describe("3. POST /api/codex/verify-key - Binding and Conflict Handling", () => {
    it("should verify and bind new key for guest user successfully", async () => {
      const testKey = "sk-guest-valid-test-key-10001";
      const tokenId = 991001;

      vi.spyOn(ModelApiService, "verifyCustomerKey").mockResolvedValue({
        valid: true,
        tokenId,
        name: "Guest Test Key",
        remainQuota: 5000000,
        unlimitedQuota: false,
      });

      const req = new NextRequest("http://localhost:3000/api/codex/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: testKey,
          email: "guest@example.com",
        }),
      });

      const res = await verifyKeyHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.valid).toBe(true);
      expect(data.maskedKey).toContain("sk-");
      expect(data.keyName).toBe("Guest Test Key");
      expect(data.currentQuotaUsd).toBe(10);
      expect(data.bindingId).toBeDefined();

      testBindingIds.push(data.bindingId);

      // Verify in DB
      const binding = await prisma.customerApiKeyBinding.findUnique({
        where: { id: data.bindingId },
      });
      expect(binding).toBeDefined();
      expect(binding?.upstreamTokenId).toBe(tokenId);
      expect(binding?.guestEmail).toBe("guest@example.com");
      expect(binding?.userId).toBeNull();
    });

    it("should verify and bind key to logged-in user", async () => {
      const user = await prisma.user.create({
        data: {
          username: `user_${Date.now()}`,
          passwordHash: "hash123",
        },
      });
      testUserIds.push(user.id);

      const sessionToken = await createUserSessionToken({
        userId: user.id,
        username: user.username!,
        role: "CUSTOMER",
      });

      const testKey = "sk-user-valid-test-key-20002";
      const tokenId = 992002;

      vi.spyOn(ModelApiService, "verifyCustomerKey").mockResolvedValue({
        valid: true,
        tokenId,
        name: "User Key 1",
        remainQuota: 2500000,
      });

      const req = new NextRequest("http://localhost:3000/api/codex/verify-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${USER_COOKIE_NAME}=${sessionToken}`,
        },
        body: JSON.stringify({ apiKey: testKey }),
      });

      const res = await verifyKeyHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.valid).toBe(true);
      expect(data.currentQuotaUsd).toBe(5);

      testBindingIds.push(data.bindingId);

      const binding = await prisma.customerApiKeyBinding.findUnique({
        where: { id: data.bindingId },
      });
      expect(binding?.userId).toBe(user.id);
    });

    it("should reject with 409 if key is already bound to another registered user", async () => {
      const user1 = await prisma.user.create({
        data: {
          username: `user1_${Date.now()}`,
          passwordHash: "hash123",
        },
      });
      const user2 = await prisma.user.create({
        data: {
          username: `user2_${Date.now()}`,
          passwordHash: "hash123",
        },
      });
      testUserIds.push(user1.id, user2.id);

      const testKey = "sk-conflict-key-30003";
      const tokenId = 993003;
      const fingerprint = computeKeyFingerprint(testKey);

      // Create binding owned by user1
      const binding = await prisma.customerApiKeyBinding.create({
        data: {
          userId: user1.id,
          upstreamTokenId: tokenId,
          keyFingerprint: fingerprint,
          maskedKey: maskApiKey(testKey),
          keyName: "User 1 Key",
          status: "ACTIVE",
        },
      });
      testBindingIds.push(binding.id);

      vi.spyOn(ModelApiService, "verifyCustomerKey").mockResolvedValue({
        valid: true,
        tokenId,
        name: "User 1 Key",
        remainQuota: 5000000,
      });

      // User2 attempts to verify/bind the exact same key
      const session2Token = await createUserSessionToken({
        userId: user2.id,
        username: user2.username!,
        role: "CUSTOMER",
      });

      const reqUser2 = new NextRequest("http://localhost:3000/api/codex/verify-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${USER_COOKIE_NAME}=${session2Token}`,
        },
        body: JSON.stringify({ apiKey: testKey }),
      });

      const resUser2 = await verifyKeyHandler(reqUser2);
      expect(resUser2.status).toBe(409);
      const dataUser2 = await resUser2.json();
      expect(dataUser2.error).toContain("liên kết với một tài khoản khác");

      // Guest attempts to verify/bind the key owned by user1
      const reqGuest = new NextRequest("http://localhost:3000/api/codex/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: testKey }),
      });

      const resGuest = await verifyKeyHandler(reqGuest);
      expect(resGuest.status).toBe(409);
      const dataGuest = await resGuest.json();
      expect(dataGuest.error).toContain("liên kết với một tài khoản khác");
    });

    it("should allow same owner to re-verify and update existing key metadata", async () => {
      const user = await prisma.user.create({
        data: {
          username: `user_reverify_${Date.now()}`,
          passwordHash: "hash123",
        },
      });
      testUserIds.push(user.id);

      const testKey = "sk-reverify-key-40004";
      const tokenId = 994004;
      const fingerprint = computeKeyFingerprint(testKey);

      const existing = await prisma.customerApiKeyBinding.create({
        data: {
          userId: user.id,
          upstreamTokenId: tokenId,
          keyFingerprint: fingerprint,
          maskedKey: maskApiKey(testKey),
          keyName: "Old Key Name",
          status: "ACTIVE",
        },
      });
      testBindingIds.push(existing.id);

      vi.spyOn(ModelApiService, "verifyCustomerKey").mockResolvedValue({
        valid: true,
        tokenId,
        name: "Updated Key Name",
        remainQuota: 5000000,
      });

      const sessionToken = await createUserSessionToken({
        userId: user.id,
        username: user.username!,
        role: "CUSTOMER",
      });

      const req = new NextRequest("http://localhost:3000/api/codex/verify-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${USER_COOKIE_NAME}=${sessionToken}`,
        },
        body: JSON.stringify({ apiKey: testKey }),
      });

      const res = await verifyKeyHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.bindingId).toBe(existing.id);
      expect(data.keyName).toBe("Updated Key Name");
    });
  });

  describe("4. GET /api/codex/my-keys", () => {
    it("should return 401 if user is not authenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/codex/my-keys", {
        method: "GET",
      });

      const res = await myKeysHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("should return list of keys belonging to authenticated user", async () => {
      const userA = await prisma.user.create({
        data: {
          username: `usera_${Date.now()}`,
          passwordHash: "hash123",
        },
      });
      const userB = await prisma.user.create({
        data: {
          username: `userb_${Date.now()}`,
          passwordHash: "hash123",
        },
      });
      testUserIds.push(userA.id, userB.id);

      const keyA1 = await prisma.customerApiKeyBinding.create({
        data: {
          userId: userA.id,
          upstreamTokenId: 995001,
          keyFingerprint: "fp_a1_" + Date.now(),
          maskedKey: "sk-a1...0001",
          keyName: "Key A1",
          status: "ACTIVE",
        },
      });
      const keyA2 = await prisma.customerApiKeyBinding.create({
        data: {
          userId: userA.id,
          upstreamTokenId: 995002,
          keyFingerprint: "fp_a2_" + Date.now(),
          maskedKey: "sk-a2...0002",
          keyName: "Key A2",
          status: "ACTIVE",
        },
      });
      const keyB1 = await prisma.customerApiKeyBinding.create({
        data: {
          userId: userB.id,
          upstreamTokenId: 995003,
          keyFingerprint: "fp_b1_" + Date.now(),
          maskedKey: "sk-b1...0003",
          keyName: "Key B1",
          status: "ACTIVE",
        },
      });
      testBindingIds.push(keyA1.id, keyA2.id, keyB1.id);

      const tokenA = await createUserSessionToken({
        userId: userA.id,
        username: userA.username!,
        role: "CUSTOMER",
      });

      const reqA = new NextRequest("http://localhost:3000/api/codex/my-keys", {
        method: "GET",
        headers: {
          cookie: `${USER_COOKIE_NAME}=${tokenA}`,
        },
      });

      const resA = await myKeysHandler(reqA);
      expect(resA.status).toBe(200);
      const dataA = await resA.json();

      expect(dataA.success).toBe(true);
      expect(dataA.keys).toBeDefined();
      expect(Array.isArray(dataA.keys)).toBe(true);

      const returnedIds = dataA.keys.map((k: any) => k.id);
      expect(returnedIds).toContain(keyA1.id);
      expect(returnedIds).toContain(keyA2.id);
      expect(returnedIds).not.toContain(keyB1.id);
    });
  });
});
