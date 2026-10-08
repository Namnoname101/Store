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

  const navigation = [
    {
      name: "Tổng quan",
      href: "/admin",
      icon: LayoutDashboard,
      current: pathname === "/admin",
    },
    {
      name: "Sản phẩm",
      href: "/admin/products",
      icon: Package,
      current: pathname.startsWith("/admin/products"),
    },
    {
      name: "Nhập kho",
      href: "/admin/inventory",
      icon: KeyRound,
      current: pathname.startsWith("/admin/inventory"),
    },
    {
      name: "Đơn hàng",
      href: "/admin/orders",
      icon: ShoppingCart,
      current: pathname.startsWith("/admin/orders"),
    },
    {
      name: "Đối soát ngân hàng",
      href: "/admin/reconciliation",
      icon: Scale,
      current: pathname.startsWith("/admin/reconciliation"),
    },
    {
      name: "Mã giảm giá",
      href: "/admin/coupons",
      icon: Ticket,
      current: pathname.startsWith("/admin/coupons"),
    },
    {
      name: "Nhà cung cấp",
      href: "/admin/suppliers",
      icon: Truck,
      current: pathname.startsWith("/admin/suppliers"),
    },
    {
      name: "Thành viên & Ví",
      href: "/admin/users",
      icon: Users,
      current: pathname.startsWith("/admin/users"),
    },
    {
      name: "Auto Locket Gold",
      href: "/admin/locket-auto",
      icon: Zap,
      current: pathname.startsWith("/admin/locket-auto"),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b0f19] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Bar */}
      <div className="md:hidden flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-400" />
          <span className="font-bold text-white text-sm">DigiStore Admin</span>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Toggle navigation"
        >
          {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          isMobileNavOpen ? "block" : "hidden"
        } md:block md:w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-md`}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div className="space-y-6">
            {/* Header Badge */}
            <div className="hidden md:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Shield className="h-5 w-5 text-indigo-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Quản trị viên</h2>
                <p className="text-[11px] text-slate-400">DigiStore Admin Panel</p>
              </div>
            </div>

            {/* Nav items */}
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                      item.current
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${item.current ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer Back & Logout Links */}
          <div className="pt-6 border-t border-slate-800/60 mt-6 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại cửa hàng</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all text-left disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
