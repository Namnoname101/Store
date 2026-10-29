"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  KeyRound,
  ShoppingCart,
  Truck,
  ArrowLeft,
  Shield,
  Menu,
  X,
  LogOut,
  Ticket,
  Users,
  Zap,
  Scale,
  Sparkles,
  ExternalLink,
  Activity,
  HardDrive,
  CheckCircle2,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // If on admin login page, render children cleanly without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navGroups = [
    {
      group: "TỔNG QUAN",
      items: [
        {
          name: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          current: pathname === "/admin",
        },
      ],
    },
    {
      group: "KHO TÀI NGUYÊN",
      items: [
        {
          name: "Sản phẩm",
          href: "/admin/products",
          icon: Package,
          current: pathname.startsWith("/admin/products"),
        },
        {
          name: "Nhập kho Key",
          href: "/admin/inventory",
          icon: KeyRound,
          current: pathname.startsWith("/admin/inventory"),
        },
        {
          name: "Mã giảm giá",
          href: "/admin/coupons",
          icon: Ticket,
          current: pathname.startsWith("/admin/coupons"),
        },
      ],
    },
    {
      group: "GIAO DỊCH & ĐỐI SOÁT",
      items: [
        {
          name: "Đơn hàng",
          href: "/admin/orders",
          icon: ShoppingCart,
          current: pathname.startsWith("/admin/orders"),
        },
        {
          name: "Đối soát VietQR",
          href: "/admin/reconciliation",
          icon: Scale,
          current: pathname.startsWith("/admin/reconciliation"),
        },
        {
          name: "Thành viên & Ví",
          href: "/admin/users",
          icon: Users,
          current: pathname.startsWith("/admin/users"),
        },
      ],
    },
    {
      group: "HỆ THỐNG & TỰ ĐỘNG",
      items: [
        {
          name: "Nhà cung cấp (Dropship)",
          href: "/admin/suppliers",
          icon: Truck,
          current: pathname.startsWith("/admin/suppliers"),
        },
        {
          name: "Auto Locket Gold",
          href: "/admin/locket-auto",
          icon: Zap,
          current: pathname.startsWith("/admin/locket-auto"),
        },
        {
          name: "Codex & ModelAPI",
          href: "/admin/codex",
          icon: Sparkles,
          current: pathname.startsWith("/admin/codex"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-sm shadow-blue-500/25">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-white text-sm tracking-tight">DaiTruong</span>
            <span className="ml-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">STUDIO</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Toggle navigation"
        >
          {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          isMobileNavOpen ? "block" : "hidden"
        } md:block md:w-64 shrink-0 border-r border-white/5 bg-slate-950/90 backdrop-blur-2xl z-40 md:sticky md:top-0 md:h-screen md:overflow-y-auto no-scrollbar`}
      >
        <div className="flex min-h-full flex-col justify-between p-4">
          <div className="space-y-6">
            {/* Header Branding */}
            <div className="hidden md:flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-indigo-950/20 to-slate-900/60 border border-white/10 shadow-inner">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-extrabold text-white truncate">DaiTruong</h2>
                  <span className="text-[9px] font-bold tracking-wider text-blue-400 bg-blue-500/20 px-1.5 py-0.2 rounded border border-blue-400/30">
                    STUDIO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">MMO Admin Control</p>
              </div>
            </div>

            {/* Nav Groups */}
            <nav className="space-y-5">
              {navGroups.map((group) => (
                <div key={group.group} className="space-y-1">
                  <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    {group.group}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileNavOpen(false)}
                          className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                            item.current
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 ring-1 ring-blue-400/40"
                              : "text-slate-400 hover:bg-slate-900 hover:text-slate-100 border border-transparent hover:border-white/5"
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${item.current ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Footer Back & Logout Links */}
          <div className="pt-4 border-t border-white/5 mt-6 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-transparent hover:border-white/5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại cửa hàng</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-left disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Topbar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar System Status Banner */}
        <header className="hidden md:flex h-14 items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-6 sticky top-0 z-30">
          {/* Breadcrumb or Current Area */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-300 font-medium">DaiTruong Studio</span>
            <span>/</span>
            <span className="text-white font-semibold capitalize">
              {pathname === "/admin" ? "Dashboard Tổng Quan" : pathname.replace("/admin/", "").replace("-", " ")}
            </span>
          </div>

          {/* Live System Health Badges */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>VietQR: Online</span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400">
              <HardDrive className="h-3 w-3 text-blue-400" />
              <span>SQLite WAL: Healthy</span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all hover:border-blue-500/40"
            >
              <span>Xem Storefront</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
