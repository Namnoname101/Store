"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Home,
  LayoutGrid,
  Wallet,
  Search,
  User,
} from "lucide-react";

export default function MobileBottomDock() {
  const pathname = usePathname();
  const { toggleMobile, isMobileOpen } = useSidebar();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Do not render on admin or checkout routes where custom bottom bars exist
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/checkout")) {
    return null;
  }

  useEffect(() => {
    const checkAuth = () => {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          setIsLoggedIn(Boolean(data?.authenticated));
        })
        .catch(() => setIsLoggedIn(false));
    };
    checkAuth();
    window.addEventListener("auth-change", checkAuth);
    return () => window.removeEventListener("auth-change", checkAuth);
  }, []);

  const isHome = pathname === "/";
  const isTopup = pathname?.startsWith("/topup");
  const isLookup = pathname?.startsWith("/lookup");
  const isProfile = pathname?.startsWith("/profile") || pathname?.startsWith("/login");

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#070b14]/95 border-t border-slate-200 dark:border-white/10 backdrop-blur-xl px-2 py-1 shadow-2xl safe-area-bottom select-none"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto text-[10px] font-medium">
        {/* 1. Trang chủ */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1.5 transition-colors ${
            isHome && !isMobileOpen
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Trang chủ</span>
        </Link>

        {/* 2. Danh mục (Opens full slide-over drawer) */}
        <button
          type="button"
          onClick={toggleMobile}
          className={`flex flex-col items-center justify-center py-1.5 transition-colors ${
            isMobileOpen
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span>Danh mục</span>
        </button>

        {/* 3. Nạp ví */}
        <Link
          href="/topup"
          className={`flex flex-col items-center justify-center py-1.5 transition-colors ${
            isTopup
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span>Nạp ví</span>
        </Link>

        {/* 4. Tra cứu */}
        <Link
          href="/lookup"
          className={`flex flex-col items-center justify-center py-1.5 transition-colors ${
            isLookup
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span>Tra cứu</span>
        </Link>

        {/* 5. Tài khoản */}
        <Link
          href={isLoggedIn ? "/profile" : "/login"}
          className={`flex flex-col items-center justify-center py-1.5 transition-colors ${
            isProfile
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>{isLoggedIn ? "Tài khoản" : "Đăng nhập"}</span>
        </Link>
      </div>
    </nav>
  );
}
