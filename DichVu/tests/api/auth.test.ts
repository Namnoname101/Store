import { describe, it, expect, beforeEach } from "vitest";
import prisma from "@/lib/prisma";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { GET as meHandler } from "@/app/api/auth/me/route";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-auth";
import { NextRequest } from "next/server";

describe("User Auth API Endpoints", () => {
  beforeEach(async () => {
    await prisma.walletTransaction.deleteMany();
    await prisma.depositOrder.deleteMany();
    await prisma.user.deleteMany();
  });

  it("POST /api/auth/register should register new user successfully", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: "johndoe",
        email: "johndoe@example.com",
        password: "password123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.username).toBe("johndoe");
    expect(data.user.balance).toBe(0);

    // Verify Set-Cookie header is present
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(USER_COOKIE_NAME);
  });

  it("POST /api/auth/register should reject duplicate username", async () => {
    await prisma.user.create({
      data: {
        username: "existinguser",
        passwordHash: "hash123",
      },
    });

    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: "existinguser",
        password: "password123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain("tồn tại");
  });

  it("POST /api/auth/login should authenticate user and set cookie", async () => {
    // First register
    const regReq = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: "loginuser",
        password: "correctpassword",
      }),
      headers: { "Content-Type": "application/json" },
    });
    await registerHandler(regReq);

    // Then login
    const loginReq = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: "loginuser",
        password: "correctpassword",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await loginHandler(loginReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.username).toBe("loginuser");
  });

  it("POST /api/auth/login should reject invalid credentials", async () => {
    const loginReq = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: "nonexistent",
        password: "wrongpassword",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await loginHandler(loginReq);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("GET /api/auth/me should return current user info and balance", async () => {
    const user = await prisma.user.create({
      data: {
        username: "meuser",
        passwordHash: "dummyhash",
        balance: 150000,
        totalDeposited: 200000,
      },
    });

    const token = await createUserSessionToken({
      userId: user.id,
      username: user.username!,
      role: "CUSTOMER",
    });

    const req = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: {
        cookie: `${USER_COOKIE_NAME}=${token}`,
      },
    });

    const res = await meHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.authenticated).toBe(true);
    expect(data.user.username).toBe("meuser");
    expect(data.user.balance).toBe(150000);
    expect(data.user.totalDeposited).toBe(200000);
  });

  it("POST /api/auth/logout should clear cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
    });
    const res = await logoutHandler();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("Max-Age=0");
  });
});
