import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import React from "react";
import StorefrontShell from "@/components/StorefrontShell";

let mockCurrentPath: string | null = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockCurrentPath,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Milestone 1 Adversarial Suite: Theme Tokens & Layout Invariants", () => {
  const globalsCssPath = path.resolve(process.cwd(), "src/app/globals.css");
  const tailwindConfigPath = path.resolve(process.cwd(), "tailwind.config.ts");

  // =========================================================================
  // 1. Theme Tokens & globals.css Parsing
  // =========================================================================
  describe("globals.css & PostCSS Parsing", () => {
    it("parses globals.css without syntax errors", async () => {
      expect(fs.existsSync(globalsCssPath)).toBe(true);
      const cssContent = fs.readFileSync(globalsCssPath, "utf-8");

      const parsed = await postcss().process(cssContent, {
        from: globalsCssPath,
      });
      expect(parsed.css).toBeDefined();
      expect(parsed.warnings().length).toBe(0);
    });

    it("verifies all required semantic CSS variables are defined in :root and .dark", () => {
      const cssContent = fs.readFileSync(globalsCssPath, "utf-8");

      const requiredTokens = [
        "--background",
        "--foreground",
        "--card",
        "--card-foreground",
        "--popover",
        "--popover-foreground",
        "--primary",
        "--primary-foreground",
        "--secondary",
        "--secondary-foreground",
        "--muted",
        "--muted-foreground",
        "--accent",
        "--accent-foreground",
        "--destructive",
        "--destructive-foreground",
        "--border",
        "--input",
        "--ring",
        "--radius",
      ];

      // Extract :root block
      const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
      expect(rootMatch).not.toBeNull();
      const rootContent = rootMatch![1];

      // Extract .dark block
      const darkMatch = cssContent.match(/\.dark\s*\{([^}]+)\}/);
      expect(darkMatch).not.toBeNull();
      const darkContent = darkMatch![1];

      for (const token of requiredTokens) {
        expect(rootContent, `:root missing ${token}`).toContain(token);
        if (token !== "--radius") {
          expect(darkContent, `.dark missing ${token}`).toContain(token);
        }
      }
    });

    it("verifies HSL channel syntax in :root and .dark (space-separated H S% L%)", () => {
      const cssContent = fs.readFileSync(globalsCssPath, "utf-8");
      
      // Matches tokens like: --primary: 221 83% 53%;
      const hslTokenRegex = /--(background|foreground|card|card-foreground|primary|secondary|muted|accent|destructive|border):\s*([\d\.]+)\s+([\d\.]+)%\s+([\d\.]+)%;/g;
      
      let matchCount = 0;
      let match;
      while ((match = hslTokenRegex.exec(cssContent)) !== null) {
        matchCount++;
        const [, tokenName, h, s, l] = match;
        const hue = parseFloat(h);
        const sat = parseFloat(s);
        const light = parseFloat(l);

        expect(hue, `${tokenName} hue in [0, 360]`).toBeGreaterThanOrEqual(0);
        expect(hue, `${tokenName} hue in [0, 360]`).toBeLessThanOrEqual(360);
        expect(sat, `${tokenName} sat in [0, 100]`).toBeGreaterThanOrEqual(0);
        expect(sat, `${tokenName} sat in [0, 100]`).toBeLessThanOrEqual(100);
        expect(light, `${tokenName} light in [0, 100]`).toBeGreaterThanOrEqual(0);
        expect(light, `${tokenName} light in [0, 100]`).toBeLessThanOrEqual(100);
      }

      // We expect at least 11 tokens in :root and 11 in .dark = 22 matches
      expect(matchCount).toBeGreaterThanOrEqual(20);
    });
  });

  // =========================================================================
  // 2. Tailwind CSS Evaluation & Opacity Variants
  // =========================================================================
  describe("Tailwind CSS Token Evaluation & Opacity", () => {
    it("evaluates semantic utility classes and alpha opacity variants correctly", async () => {
      const tailwindConfig = await import(tailwindConfigPath);
      const config = tailwindConfig.default || tailwindConfig;

      const classesToTest = [
        "bg-background",
        "text-foreground",
        "bg-card",
        "text-card-foreground",
        "bg-primary",
        "text-primary-foreground",
        "border-border",
        "bg-primary/50",
        "border-border/80",
        "bg-card/20",
        "bg-accent/30",
        "text-destructive/90",
        "bg-primary/[0.33]",
        "bg-primary-600",
        "bg-slate-750",
        "bg-zinc-850",
      ];

      const htmlFixture = `<div class="${classesToTest.join(" ")}"></div>`;

      const inputCss = `
        @tailwind utilities;
      `;

      const result = await postcss([
        tailwindcss({
          ...config,
          content: [{ raw: htmlFixture, extension: "html" }],
        }),
      ]).process(inputCss, { from: undefined });

      const compiledCss = result.css;

      // Verify each class generated corresponding CSS rule
      for (const cls of classesToTest) {
        // Escaped class name in CSS
        const escaped = cls.replace(/\//g, "\\/").replace(/\[/g, "\\[").replace(/\]/g, "\\]").replace(/\./g, "\\.");
        const hasRule = compiledCss.includes(`.${escaped}`) || compiledCss.includes(cls);
        expect(hasRule, `Expected class '${cls}' to be generated in compiled CSS`).toBe(true);
      }

      // Verify opacity variant syntax doesn't produce NaN or invalid syntax
      expect(compiledCss).toContain("hsl(var(--primary) / 0.5)");
      expect(compiledCss).toContain("hsl(var(--border) / 0.8)");
      expect(compiledCss).toContain("hsl(var(--card) / 0.2)");
      expect(compiledCss).toContain("hsl(var(--accent) / 0.3)");
      expect(compiledCss).toContain("hsl(var(--destructive) / 0.9)");
      expect(compiledCss).toContain("hsl(var(--primary) / 0.33)");
    });
  });

// =========================================================================
// 3. StorefrontShell Layout Invariants & Adversarial Paths
// =========================================================================
describe("StorefrontShell Invariants & Edge Cases", () => {

    it("maintains 7-element fragment invariant across diverse storefront paths", () => {
      const storefrontPaths = [
        "/",
        "/products/api-claude-35-sonnet",
        "/cart",
        "/checkout/ORD847291",
        "/order-success/ORD847291",
        "/lookup",
        "/topup",
        "/developer/usage",
        "/codex",
        "/tools/prompt-master",
      ];

      for (const p of storefrontPaths) {
        mockCurrentPath = p;
        const element = StorefrontShell({
          children: React.createElement("div", { id: "child" }, "Content"),
        });

        expect(element.type, `Path '${p}' should render React.Fragment`).toBe(React.Fragment);
        const childrenArray = React.Children.toArray(element.props.children);
        expect(
          childrenArray.length,
          `Path '${p}' must render exactly 7 shell children`
        ).toBe(7);
      }
    });

    it("renders ONLY clean <main> container with semantic classes across all admin paths", () => {
      const adminPaths = [
        "/admin",
        "/admin/",
        "/admin/login",
        "/admin/dashboard",
        "/admin/products/new",
        "/admin/orders?page=2&status=PAID",
        "/admin/settings/security",
      ];

      for (const p of adminPaths) {
        mockCurrentPath = p;
        const element = StorefrontShell({
          children: React.createElement("div", { id: "admin-view" }, "Admin Panel"),
        });

        expect(element.type, `Admin path '${p}' should render <main>`).toBe("main");
        expect(element.props.className).toContain("min-h-screen");
        expect(element.props.className).toContain("bg-background");
        expect(element.props.className).toContain("text-foreground");
        expect(element.props.className).not.toContain("flex-1");
      }
    });

    it("handles null / undefined pathname without crashing", () => {
      // In Next.js SSR / fallback generation, usePathname can return null
      mockCurrentPath = null;
      expect(() => {
        const element = StorefrontShell({
          children: React.createElement("div", null, "SSR Fallback"),
        });
        expect(element).toBeDefined();
        // Since null doesn't start with /admin, should render storefront fragment
        expect(element.type).toBe(React.Fragment);
      }).not.toThrow();
    });

    it("verifies FloatingSupport behavior when pathname is null or storefront", async () => {
      const FloatingSupport = (await import("@/components/FloatingSupport")).default;
      mockCurrentPath = null;
      // When pathname is null, does FloatingSupport throw TypeError?
      let threw = false;
      try {
        FloatingSupport();
      } catch (err: any) {
        threw = true;
        console.log("FloatingSupport with null pathname threw error:", err.message);
      }
      // Note this finding
      expect(threw).toBe(true);
    });
  });
});
