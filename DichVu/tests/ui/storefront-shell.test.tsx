import { describe, it, expect, vi } from "vitest";
import React from "react";
import StorefrontShell from "@/components/StorefrontShell";

// Mock next/navigation
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("StorefrontShell Component Isolation", () => {
  it("renders storefront shell elements on customer storefront routes", () => {
    mockPathname = "/";
    const element = StorefrontShell({
      children: React.createElement("div", { id: "test-content" }, "Home"),
    });

    // On storefront, it returns a fragment with Navbar, main, Footer, CartDrawer, FloatingSupport
    expect(element).toBeDefined();
    expect(element.type).toBe(React.Fragment);
    
    // Fragment children should have 5 items: Navbar, main, Footer, CartDrawer, FloatingSupport
    const childrenArray = React.Children.toArray(element.props.children);
    expect(childrenArray.length).toBe(6);
  });

  it("renders ONLY clean main container on /admin routes without storefront navbar or footer", () => {
    mockPathname = "/admin";
    const element = StorefrontShell({
      children: React.createElement("div", { id: "test-admin" }, "Dashboard"),
    });

    expect(element).toBeDefined();
    expect(element.type).toBe("main");
    expect(element.props.className).toContain("min-h-screen");
    expect(element.props.className).not.toContain("flex-1");
  });

  it("renders ONLY clean main container on /admin/login without customer navbar", () => {
    mockPathname = "/admin/login";
    const element = StorefrontShell({
      children: React.createElement("div", { id: "test-login" }, "Admin Login"),
    });

    expect(element).toBeDefined();
    expect(element.type).toBe("main");
    expect(element.props.className).toContain("min-h-screen");
  });
});
