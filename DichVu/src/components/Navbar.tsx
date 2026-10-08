"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Shield,
  Menu,
  X,
  ReceiptText,
  Wallet,
  User,
  Sun,
  Moon,
  Sparkles,
  Layers,
  Store,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useCart } from "@/contexts/CartContext";

export const STORE_CATEGORIES = [
  { name: "Tất cả", slug: "all" },
  { name: "AI & API", slug: "ai-api", query: "ai" },
  { name: "Cloud", slug: "cloud", query: "cloud" },
  { name: "TikTok", slug: "tiktok", query: "tiktok" },
  { name: "Facebook", slug: "facebook", query: "facebook" },
  { name: "Instagram", slug: "instagram", query: "instagram" },
  { name: "YouTube", slug: "youtube", query: "youtube" },
  { name: "Khác", slug: "khac", query: "khac" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<{ id: string; username: string; balance: number; role?: string } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { openCart, itemCount } = useCart();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoadingUser(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}#catalog`);
      setIsMobileMenuOpen(false);
    } else {
      router.push("/#catalog");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0b0f19]/90 backdrop-blur-md transition-colors duration-150 shadow-sm">
      {/* Main Top Header */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/25 group-hover:bg-blue-700 transition-all">
              <Store className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-105" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                Daitruong<span className="text-blue-600">Store</span>
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Dịch Vụ Số & Tự Động 24/7
              </span>
            </div>
          </Link>
        </div>

        {/* Prominent Search Bar - Desktop & Tablet */}
        <div className="hidden sm:flex flex-1 max-w-lg mx-2 md:mx-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ AI, Cloud, TikTok, Facebook, YouTube..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 py-2.5 pl-10 pr-20 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Action Controls - Desktop */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {/* Order lookup */}
          <Link
            href="/lookup"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white transition-all shadow-sm"
          >
            <ReceiptText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Tra cứu đơn</span>
          </Link>

          {/* Cart Drawer Trigger - Desktop */}
          <button
            onClick={openCart}
            aria-label="Mở giỏ hàng"
            className="relative flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white transition-all shadow-sm"
          >
            <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Giỏ hàng</span>
            {itemCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white shadow-sm">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Đổi giao diện sáng/tối"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors shadow-sm"
            title={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* User Session / Wallet */}
          {!isLoadingUser && (
            user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/topup"
                  title="Nạp tiền vào ví"
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all shadow-sm group"
                >
                  <Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>{user.balance.toLocaleString("vi-VN")}đ</span>
                </Link>

                <Link
                  href="/profile"
                  title="Trang cá nhân & Lịch sử số dư"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                  <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="max-w-[90px] truncate">{user.username}</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/25"
              >
                <User className="h-3.5 w-3.5" />
                <span>Đăng nhập</span>
              </Link>
            )
          )}

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-slate-900/80 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-800 transition-all shadow-sm"
            >
              <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Quản trị</span>
            </Link>
          )}
        </div>

        {/* Mobile controls (Cart + Theme toggle + hamburger) */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
          {/* Cart Icon Mobile */}
          <Link
            href="/cart"
            aria-label="Giỏ hàng"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          <button
            onClick={toggleTheme}
            aria-label="Đổi giao diện sáng/tối"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Category Navigation Bar (Subnav on Desktop) */}
      <div className="hidden lg:block border-t border-slate-100 dark:border-slate-850/60 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 lg:space-x-2 text-xs font-medium">
            {STORE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.slug === "all" ? "/#catalog" : `/?search=${encodeURIComponent(cat.query || cat.name)}#catalog`}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/80 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hệ thống tự động kích hoạt 24/7 qua VietQR</span>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] px-4 pt-3 pb-6 md:hidden shadow-lg animate-in slide-in-from-top-2 duration-150">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm AI, Cloud, TikTok, FB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 focus:outline-none"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </form>

          {/* Mobile Category Quick Chips */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Danh mục nổi bật
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STORE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={cat.slug === "all" ? "/#catalog" : `/?search=${encodeURIComponent(cat.query || cat.name)}#catalog`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <span>Trang chủ</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              href="/#catalog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <span>Kho sản phẩm dịch vụ</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              href="/lookup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <div className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Tra cứu đơn hàng</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link
              href="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Giỏ hàng</span>
              </div>
              <div className="flex items-center gap-1.5">
                {itemCount > 0 && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>

            {/* Mobile User / Auth */}
            {user ? (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <Link
                  href="/topup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Số dư ví</span>
                  </div>
                  <span>{user.balance.toLocaleString("vi-VN")}đ</span>
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 px-2 py-2"
                >
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Tài khoản ({user.username})</span>
                </Link>
              </div>
            ) : (
              <div className="pt-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20"
                >
                  <User className="h-4 w-4" />
                  <span>Đăng nhập / Đăng ký</span>
                </Link>
              </div>
            )}

            {user?.role === "ADMIN" && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400"
                >
                  <Shield className="h-4 w-4" />
                  <span>Trang quản trị (Admin)</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
