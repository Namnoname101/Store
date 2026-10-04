import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  verifyAdminPassword,
  createAdminSessionToken,
  verifyAdminSessionToken,
  ADMIN_COOKIE_NAME,
} from "@/lib/admin-auth";

describe("Admin Auth Service", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "test-secret-password-123";
  });

  it("should verify correct admin password and reject invalid password", async () => {
    expect(await verifyAdminPassword("test-secret-password-123")).toBe(true);
    expect(await verifyAdminPassword("wrong-password")).toBe(false);
    expect(await verifyAdminPassword("")).toBe(false);
  });

  it("should fallback to default admin password if env is unset", async () => {
    delete process.env.ADMIN_PASSWORD;
    expect(await verifyAdminPassword("admin123")).toBe(true);
    expect(await verifyAdminPassword("wrongpass")).toBe(false);
  });

  it("should create and verify signed session tokens", async () => {
    const token = await createAdminSessionToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
    expect(await verifyAdminSessionToken(token)).toBe(true);
  });

  it("should reject tampered or expired tokens", async () => {
    const token = await createAdminSessionToken();
    expect(await verifyAdminSessionToken(token + "tampered")).toBe(false);
    expect(await verifyAdminSessionToken("invalid.token.here")).toBe(false);
    expect(await verifyAdminSessionToken("")).toBe(false);
  });

  it("should have correct cookie name defined", () => {
    expect(ADMIN_COOKIE_NAME).toBe("admin_session");
  });
});
