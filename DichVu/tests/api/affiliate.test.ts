import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-auth";
import { GET as getAffiliateHandler } from "@/app/api/affiliate/route";
import { POST as registerAffiliateHandler } from "@/app/api/affiliate/register/route";

describe("CTV / Affiliate API Endpoints Tests", () => {
  beforeEach(async () => {
    // Keep test db clean
  });

  describe("GET /api/affiliate", () => {
    it("should return 401 when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/affiliate");
      const res = await getAffiliateHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it("should return 200 with isAffiliate: false for normal customer", async () => {
      const user = await prisma.user.create({
        data: {
          username: `cust_${Date.now()}`,
          passwordHash: "hash",
          balance: 10000,
          isAffiliate: false,
        },
      });

      const token = await createUserSessionToken({
        userId: user.id,
        username: user.username!,
        role: "CUSTOMER",
      });

      const req = new NextRequest("http://localhost:3000/api/affiliate", {
        headers: {
          cookie: `${USER_COOKIE_NAME}=${token}`,
        },
      });

      const res = await getAffiliateHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.isAffiliate).toBe(false);
      expect(data.data.affiliateCode).toBeNull();
    });

    it("should return 200 with full CTV stats for affiliate user", async () => {
      const testAffCode = `CTV_FULL_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const user = await prisma.user.create({
        data: {
          username: `ctv_full_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          passwordHash: "hash",
          balance: 75000,
          isAffiliate: true,
          affiliateCode: testAffCode,
          bankName: "MBBank",
          bankAccountNumber: "0987654321",
          bankAccountName: "LE HOP",
        },
      });

      const token = await createUserSessionToken({
        userId: user.id,
        username: user.username!,
        role: "CUSTOMER",
      });

      const req = new NextRequest("http://localhost:3000/api/affiliate", {
        headers: {
          cookie: `${USER_COOKIE_NAME}=${token}`,
        },
      });

      const res = await getAffiliateHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.isAffiliate).toBe(true);
      expect(data.data.affiliateCode).toBe(testAffCode);
      expect(data.data.balance).toBe(75000);
      expect(data.data.bankInfo.bankName).toBe("MBBank");
      expect(data.data.bankInfo.bankAccountNumber).toBe("0987654321");
    });

    it("should return 401 when token user does not exist in DB", async () => {
      const token = await createUserSessionToken({
        userId: "non-existent-user-id-999",
        username: "ghost_user",
        role: "CUSTOMER",
      });

      const req = new NextRequest("http://localhost:3000/api/affiliate", {
        headers: {
          cookie: `${USER_COOKIE_NAME}=${token}`,
        },
      });

      const res = await getAffiliateHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });

  describe("POST /api/affiliate/register", () => {
    it("should return 401 when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/affiliate/register", {
        method: "POST",
        body: JSON.stringify({ customCode: "TEST" }),
      });
      const res = await registerAffiliateHandler(req);
      expect(res.status).toBe(401);
    });

    it("should register user as CTV, return affiliate code, and create coupon", async () => {
      const user = await prisma.user.create({
        data: {
          username: `register_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          passwordHash: "hash",
          balance: 0,
          isAffiliate: false,
        },
      });

      const token = await createUserSessionToken({
        userId: user.id,
        username: user.username!,
        role: "CUSTOMER",
      });

      const rawCustom = `CTV_${Date.now().toString().slice(-4)}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const expectedCode = rawCustom;

      const req = new NextRequest("http://localhost:3000/api/affiliate/register", {
        method: "POST",
        headers: {
          cookie: `${USER_COOKIE_NAME}=${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customCode: rawCustom,
          bankName: "Techcombank",
          bankAccountNumber: "1903333333",
          bankAccountName: "NGUYEN VAN B",
        }),
      });

      const res = await registerAffiliateHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.affiliateCode).toBe(expectedCode);

      // Verify DB state
      const updated = await prisma.user.findUnique({
        where: { id: user.id },
        include: { affiliateCoupons: true },
      });
      expect(updated?.isAffiliate).toBe(true);
      expect(updated?.affiliateCode).toBe(expectedCode);
      expect(updated?.bankName).toBe("Techcombank");
      expect(updated?.affiliateCoupons.length).toBe(1);
      expect(updated?.affiliateCoupons[0].code).toBe(expectedCode);
    });

    it("should return existing affiliateCode if user is already an affiliate", async () => {
      const testAffCode = `CTV_ALREADY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const user = await prisma.user.create({
        data: {
          username: `already_ctv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          passwordHash: "hash",
          balance: 10000,
          isAffiliate: true,
          affiliateCode: testAffCode,
        },
      });

      const token = await createUserSessionToken({
        userId: user.id,
        username: user.username!,
        role: "CUSTOMER",
      });

      const req = new NextRequest("http://localhost:3000/api/affiliate/register", {
        method: "POST",
        headers: {
          cookie: `${USER_COOKIE_NAME}=${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customCode: "NEW_CODE",
        }),
      });

      const res = await registerAffiliateHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.affiliateCode).toBe(testAffCode);
      expect(data.message).toBe("Tài khoản đã là CTV");
    });
  });
});
