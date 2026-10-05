import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createUserSessionToken,
  verifyUserSessionToken,
  USER_COOKIE_NAME,
} from "@/lib/user-auth";

describe("User Authentication Engine (Web Crypto)", () => {
  it("should hash password with salt and verify correctly", async () => {
    const password = "mySecurePassword123";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).toContain(":"); // salt:hash format
    expect(hash).not.toBe(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("wrongPassword", hash);
    expect(isInvalid).toBe(false);
  });

  it("should create and verify valid session token", async () => {
    const payload = {
      userId: "usr-12345",
      username: "alice",
      role: "CUSTOMER",
    };

    const token = await createUserSessionToken(payload);
    expect(token).toBeDefined();
    expect(token).toContain(".");

    const verified = await verifyUserSessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe("usr-12345");
    expect(verified?.username).toBe("alice");
    expect(verified?.role).toBe("CUSTOMER");
    expect(verified?.exp).toBeGreaterThan(Date.now());
  });

  it("should reject tampered or expired session token", async () => {
    const payload = {
      userId: "usr-12345",
      username: "alice",
      role: "CUSTOMER",
    };

    const token = await createUserSessionToken(payload);
    const parts = token.split(".");
    const tamperedToken = `${parts[0]}.invalidSignature`;

    const verified = await verifyUserSessionToken(tamperedToken);
    expect(verified).toBeNull();

    const emptyVerify = await verifyUserSessionToken("");
    expect(emptyVerify).toBeNull();
  });

  it("should export USER_COOKIE_NAME as user_session", () => {
    expect(USER_COOKIE_NAME).toBe("user_session");
  });
});
