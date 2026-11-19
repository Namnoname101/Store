import { describe, it, expect, vi } from "vitest";
import React from "react";
import ReactDOMServer from "react-dom/server";
import MobileBottomDock from "@/components/MobileBottomDock";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/contexts/SidebarContext";

let mockPathname = "/products/api-claude-10-max-10-credit";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("Rules of Hooks Validation for AppSidebar and MobileBottomDock", () => {
  it("renders MobileBottomDock safely across storefront and /checkout routes", () => {
    mockPathname = "/products/api-claude-10-max-10-credit";
    const html1 = ReactDOMServer.renderToString(
      React.createElement(SidebarProvider, null, React.createElement(MobileBottomDock))
    );
    expect(html1).toContain("<nav");

    // Checkout route: should return null cleanly without crashing hooks
    mockPathname = "/checkout/ORD123456";
    const html2 = ReactDOMServer.renderToString(
      React.createElement(SidebarProvider, null, React.createElement(MobileBottomDock))
    );
    expect(html2).toBe("");
  });

  it("renders AppSidebar safely across storefront and /admin routes", () => {
    mockPathname = "/products/api-claude-10-max-10-credit";
    const html1 = ReactDOMServer.renderToString(
      React.createElement(SidebarProvider, null, React.createElement(AppSidebar))
    );
    expect(html1).toBeDefined();

    mockPathname = "/admin/products";
    const html2 = ReactDOMServer.renderToString(
      React.createElement(SidebarProvider, null, React.createElement(AppSidebar))
    );
    expect(html2).toBe("");
  });
});
