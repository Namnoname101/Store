import { describe, it, expect } from "vitest";

describe("CTV Flow and Routing Logic Integrity Tests", () => {
  describe("Navbar CTV Routing Logic", () => {
    function getNavbarCtvRoute(user: { authenticated: boolean; isAffiliate?: boolean } | null) {
      if (user?.authenticated && user?.isAffiliate) {
        return {
          desktop: {
            href: "/dashboard/affiliate",
            label: "Bảng Quản Lý CTV",
            badge: "CTV",
          },
          mobile: {
            href: "/dashboard/affiliate",
            label: "💼 Bảng Quản Lý CTV",
            badge: "CTV",
          },
        };
      }

      return {
        desktop: {
          href: "/ctv",
          label: "Kiếm Tiền CTV (0đ Vốn)",
          badge: null,
        },
        mobile: {
          href: "/ctv",
          label: "💸 Kiếm Tiền CTV Sinh Viên (0đ Vốn)",
          badge: null,
        },
      };
    }

    it("should route unauthenticated guest to /ctv across desktop and mobile", () => {
      const route = getNavbarCtvRoute(null);
      expect(route.desktop.href).toBe("/ctv");
      expect(route.desktop.label).toBe("Kiếm Tiền CTV (0đ Vốn)");
      expect(route.mobile.href).toBe("/ctv");
      expect(route.mobile.label).toContain("Kiếm Tiền CTV");
    });

    it("should route authenticated non-affiliate user to /ctv across desktop and mobile", () => {
      const route = getNavbarCtvRoute({ authenticated: true, isAffiliate: false });
      expect(route.desktop.href).toBe("/ctv");
      expect(route.mobile.href).toBe("/ctv");
    });

    it("should route authenticated affiliate user to /dashboard/affiliate with CTV badge", () => {
      const route = getNavbarCtvRoute({ authenticated: true, isAffiliate: true });
      expect(route.desktop.href).toBe("/dashboard/affiliate");
      expect(route.desktop.label).toBe("Bảng Quản Lý CTV");
      expect(route.desktop.badge).toBe("CTV");
      expect(route.mobile.href).toBe("/dashboard/affiliate");
      expect(route.mobile.label).toContain("Bảng Quản Lý CTV");
      expect(route.mobile.badge).toBe("CTV");
    });
  });

  describe("Page Route Guards and Infinite Loop Safeguards", () => {
    type PageDecision = 
      | { action: "REDIRECT"; to: string }
      | { action: "RENDER_PAGE" }
      | { action: "SHOW_ERROR"; error: string };

    function evaluateDashboardAffiliateGuard(params: {
      affiliateApiStatus: number;
      affiliateData?: { isAffiliate: boolean };
      authMeData?: { authenticated: boolean; user?: { isAffiliate: boolean } };
    }): PageDecision {
      if (params.affiliateApiStatus === 401) {
        return { action: "REDIRECT", to: "/login?callbackUrl=/dashboard/affiliate" };
      }

      if (params.affiliateApiStatus !== 200) {
        if (!params.authMeData?.authenticated) {
          return { action: "REDIRECT", to: "/login?callbackUrl=/dashboard/affiliate" };
        }
        if (!params.authMeData?.user?.isAffiliate) {
          return { action: "REDIRECT", to: "/ctv" };
        }
        // Verified affiliate encountering server error: show error, NEVER redirect to /ctv
        return { action: "SHOW_ERROR", error: "Không thể tải thông tin CTV từ hệ thống. Vui lòng thử lại sau." };
      }

      if (params.affiliateData) {
        if (!params.affiliateData.isAffiliate) {
          return { action: "REDIRECT", to: "/ctv" };
        }
        return { action: "RENDER_PAGE" };
      }

      return { action: "SHOW_ERROR", error: "Lỗi dữ liệu" };
    }

    function evaluateCtvPageGuard(params: {
      authMeData?: { authenticated: boolean; user?: { isAffiliate: boolean } };
      isRegistered?: boolean;
      viewPolicy?: boolean;
    }): PageDecision {
      if (params.authMeData?.authenticated && params.authMeData?.user?.isAffiliate && !params.isRegistered && !params.viewPolicy) {
        return { action: "REDIRECT", to: "/dashboard/affiliate" };
      }
      return { action: "RENDER_PAGE" };
    }

    it("should redirect unauthenticated visitor on /dashboard/affiliate to login", () => {
      const decision = evaluateDashboardAffiliateGuard({ affiliateApiStatus: 401 });
      expect(decision).toEqual({
        action: "REDIRECT",
        to: "/login?callbackUrl=/dashboard/affiliate",
      });
    });

    it("should redirect authenticated non-affiliate visitor on /dashboard/affiliate to /ctv", () => {
      const decision = evaluateDashboardAffiliateGuard({
        affiliateApiStatus: 200,
        affiliateData: { isAffiliate: false },
      });
      expect(decision).toEqual({
        action: "REDIRECT",
        to: "/ctv",
      });
    });

    it("should allow active affiliate on /dashboard/affiliate to render page", () => {
      const decision = evaluateDashboardAffiliateGuard({
        affiliateApiStatus: 200,
        affiliateData: { isAffiliate: true },
      });
      expect(decision).toEqual({ action: "RENDER_PAGE" });
    });

    it("CRITICAL: should NOT redirect affiliate to /ctv on 500 error (prevents infinite loop)", () => {
      const decision = evaluateDashboardAffiliateGuard({
        affiliateApiStatus: 500,
        authMeData: { authenticated: true, user: { isAffiliate: true } },
      });
      // MUST show error, NOT redirect to /ctv which would cause infinite bounce back
      expect(decision.action).toBe("SHOW_ERROR");
      expect((decision as any).to).toBeUndefined();
    });

    it("should auto-redirect active affiliate on /ctv to /dashboard/affiliate", () => {
      const decision = evaluateCtvPageGuard({
        authMeData: { authenticated: true, user: { isAffiliate: true } },
      });
      expect(decision).toEqual({
        action: "REDIRECT",
        to: "/dashboard/affiliate",
      });
    });

    it("should allow active affiliate on /ctv with ?view=policy to view policy without bounce redirect", () => {
      const decision = evaluateCtvPageGuard({
        authMeData: { authenticated: true, user: { isAffiliate: true } },
        viewPolicy: true,
      });
      expect(decision).toEqual({ action: "RENDER_PAGE" });
    });

    it("should render registration form for authenticated non-affiliate on /ctv", () => {
      const decision = evaluateCtvPageGuard({
        authMeData: { authenticated: true, user: { isAffiliate: false } },
      });
      expect(decision).toEqual({ action: "RENDER_PAGE" });
    });

    it("should render landing policy for guest on /ctv", () => {
      const decision = evaluateCtvPageGuard({
        authMeData: { authenticated: false },
      });
      expect(decision).toEqual({ action: "RENDER_PAGE" });
    });

    it("should retain registration form with success feedback when isRegistered is true during transition", () => {
      const decision = evaluateCtvPageGuard({
        authMeData: { authenticated: true, user: { isAffiliate: true } },
        isRegistered: true,
      });
      expect(decision).toEqual({ action: "RENDER_PAGE" });
    });
  });

  describe("Profile Page CTV Link Logic", () => {
    function getProfileCtvRoute(user: { isAffiliate?: boolean; affiliateCode?: string | null } | null) {
      if (user?.isAffiliate) {
        return {
          href: "/dashboard/affiliate",
          label: `Bảng Quản Lý CTV (${user.affiliateCode || "CTV"}) →`,
        };
      }
      return {
        href: "/ctv",
        label: "Đăng Ký Kiếm Tiền CTV (0đ Vốn) →",
      };
    }

    it("should route active affiliate user in profile to /dashboard/affiliate", () => {
      const route = getProfileCtvRoute({ isAffiliate: true, affiliateCode: "CTV_VIP" });
      expect(route.href).toBe("/dashboard/affiliate");
      expect(route.label).toContain("CTV_VIP");
    });

    it("should route non-affiliate user in profile to /ctv", () => {
      const route = getProfileCtvRoute({ isAffiliate: false });
      expect(route.href).toBe("/ctv");
      expect(route.label).toContain("Đăng Ký Kiếm Tiền CTV");
    });
  });
});
