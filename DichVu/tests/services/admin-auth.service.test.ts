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

  it("should verify correct admin password and reject invalid password", () => {
    expect(verifyAdminPassword("test-secret-password-123")).toBe(true);
    expect(verifyAdminPassword("wrong-password")).toBe(false);
    expect(verifyAdminPassword("")).toBe(false);
  });

  it("should fallback to default admin password if env is unset", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(verifyAdminPassword("admin123")).toBe(true);
    expect(verifyAdminPassword("wrongpass")).toBe(false);
  });

  it("should create and verify signed session tokens", () => {
    const token = createAdminSessionToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
    expect(verifyAdminSessionToken(token)).toBe(true);
  });

  it("should reject tampered or expired tokens", () => {
    const token = createAdminSessionToken();
    expect(verifyAdminSessionToken(token + "tampered")).toBe(false);
    expect(verifyAdminSessionToken("invalid.token.here")).toBe(false);
    expect(verifyAdminSessionToken("")).toBe(false);
  });

  it("should have correct cookie name defined", () => {
    expect(ADMIN_COOKIE_NAME).toBe("admin_session");
  });
});
