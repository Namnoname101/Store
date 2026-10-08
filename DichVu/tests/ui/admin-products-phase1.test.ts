import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("Phase 1: Admin Products & Middleware Guard", () => {
  it("should export AdminProductEditorPage", async () => {
    const page = await import("@/app/admin/products/[id]/page");
    expect(page.default).toBeDefined();
  });

  it("should export AdminProductEditor component", async () => {
    const editor = await import("@/components/admin/AdminProductEditor");
    expect(editor.default).toBeDefined();
  });

  it("should export AdminProductMobileCards component", async () => {
    const cards = await import("@/components/admin/AdminProductMobileCards");
    expect(cards.default).toBeDefined();
  });

  it("should block unauthenticated access to /admin routes even if path contains dot", async () => {
    const req = new NextRequest("http://localhost:3000/admin/settings.json");
    const res = await middleware(req);
    // Should redirect to login instead of allowing through
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("should block unauthenticated access to /api/admin routes even if path contains dot", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/products.test");
    const res = await middleware(req);
    // Should return 401 Unauthorized instead of allowing through
    expect(res.status).toBe(401);
  });
});
