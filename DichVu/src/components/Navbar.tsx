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
  User,
  Sun,
  Moon,
  Terminal,
  BookOpen,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  Activity,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useCart } from "@/contexts/CartContext";

export const STORE_CATEGORIES = [
  { name: "Tất cả", slug: "all" },
  { name: "AI & API", slug: "ai-api", query: "ai" },
  { name: "Cloud", slug: "cloud-vps", query: "cloud" },
  { name: "TikTok", slug: "tiktok", query: "tiktok" },
  { name: "Facebook", slug: "facebook", query: "facebook" },
  { name: "Instagram", slug: "instagram", query: "instagram" },
  { name: "YouTube", slug: "youtube", query: "youtube" },
  { name: "Khác", slug: "khac", query: "khac" },
];

export const getCategoryHref = (cat: { slug: string; name: string; query?: string }) => {
  if (cat.slug === "all") return "/#catalog";
  if (cat.slug === "ai-api") return "/?category=ai-api#catalog";
  if (cat.slug === "cloud-vps") return "/?category=cloud-vps#catalog";
  if (cat.slug === "tiktok") return "/?category=mxh&search=tiktok#catalog";
  if (cat.slug === "facebook") return "/?category=mxh&search=facebook#catalog";
  if (cat.slug === "instagram") return "/?category=mxh&search=instagram#catalog";
  if (cat.slug === "youtube") return "/?category=mxh&search=youtube#catalog";
  return `/?category=${encodeURIComponent(cat.slug)}#catalog`;
};

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuidesOpen, setIsGuidesOpen] = useState(false);
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
    <header className="sticky top-2 z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2">
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-[#070b14]/90 backdrop-blur-xl px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-lg shadow-slate-900/5 dark:shadow-2xl transition-all">
        {/* Brand Logo with MMO HUB Tag */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-extrabold text-white shadow-lg shadow-blue-500/30 text-base sm:text-lg group-hover:scale-105 transition-all shrink-0">
              D
            </div>
            <div className="flex flex-col">
              <div className="font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 text-base leading-tight">
                <span>DaiTruong</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Store</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30">MMO HUB</span>
              </div>
              <span className="hidden xl:block text-[10px] text-slate-500 dark:text-slate-400 font-medium">Chợ Tài Nguyên Số & Key Tự Động 24/7</span>
            </div>
          </Link>
        </div>

        {/* Center Navigation Links - Desktop */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          <Link href="/#catalog" className="px-2.5 xl:px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <span>Kho Tài Nguyên</span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-[10px] text-blue-600 dark:text-blue-300 font-bold">124</span>
          </Link>
          <Link href="/topup" className="px-2.5 xl:px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <span>Nạp Ví Tự Động</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-300 font-mono font-bold">+5%</span>
          </Link>
          <Link href="/lookup" className="px-2.5 xl:px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <ReceiptText className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span>Tra Cứu Đơn</span>
          </Link>

          {/* Grouped Guides & Tools Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIsGuidesOpen(true)}
            onMouseLeave={() => setIsGuidesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsGuidesOpen(!isGuidesOpen)}
              className="px-2.5 xl:px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-1 whitespace-nowrap shrink-0 text-slate-700 dark:text-slate-300"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span>Hướng Dẫn</span>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isGuidesOpen ? "rotate-180" : ""}`} />
            </button>

            {isGuidesOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-xl shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <Link
                  href="/huong-dan/codex"
                  onClick={() => setIsGuidesOpen(false)}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Terminal className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Kích Hoạt Codex API (1-Click)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Tool KhoDee-helper & cấu hình Cursor, Cline</span>
                  </div>
                </Link>
                <Link
                  href="/huong-dan/api-claude"
                  onClick={() => setIsGuidesOpen(false)}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <BookOpen className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Cấu Hình API Claude</span>
                    <span className="text-[10px] text-slate-400 font-normal">Cài đặt Cursor, Cline, Roo Code</span>
                  </div>
                </Link>
                <Link
                  href="/check-usage"
                  onClick={() => setIsGuidesOpen(false)}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Activity className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Kiểm Tra Dung Lượng Claude / Cursor</span>
                    <span className="text-[10px] text-slate-400 font-normal">Check quota Claude tức thì</span>
                  </div>
                </Link>
                <Link
                  href="/developer/usage"
                  onClick={() => setIsGuidesOpen(false)}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Terminal className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Tra Cứu Quota Codex</span>
                    <span className="text-[10px] text-slate-400 font-normal">Kiểm tra hạn mức ModelAPI & nạp thêm</span>
                  </div>
                </Link>
                <Link
                  href="/tools/prompt-master"
                  onClick={() => setIsGuidesOpen(false)}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs">Prompt AI Master</span>
                    <span className="text-[10px] text-slate-400 font-normal">Công cụ tạo prompt chuẩn kỹ thuật</span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {user?.role === "ADMIN" && (
            <Link href="/admin" className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-1 whitespace-nowrap shrink-0">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Right Actions: Search / Wallet / Cart / Login */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Search form */}
          <form onSubmit={handleSearch} className="hidden md:flex relative items-center">
            <input
              type="text"
              placeholder="Tìm nhanh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-24 lg:w-32 xl:w-40 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-slate-800/60 py-1.5 pl-8 pr-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:w-48 xl:focus:w-56 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all shadow-xs"
            />
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
          </form>

          {/* User Wallet Pill */}
          {!isLoadingUser && user && (
            <Link
              href="/topup"
              title="Số dư ví"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xs hover:bg-emerald-500/20 transition-all font-mono whitespace-nowrap shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Ví: {user.balance.toLocaleString("vi-VN")}đ</span>
            </Link>
          )}

          {/* Cart Button */}
          <button
            onClick={openCart}
            aria-label="Mở giỏ hàng"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all active:scale-95 shrink-0 whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {itemCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-blue-700 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>

          {/* User login / profile */}
          {!isLoadingUser && (
            user ? (
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all whitespace-nowrap shrink-0"
              >
                <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="max-w-[70px] truncate">{user.username}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all whitespace-nowrap shrink-0"
              >
                <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="whitespace-nowrap">Đăng nhập</span>
              </Link>
            )
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Đổi giao diện sáng/tối"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-slate-600" />}
          </button>

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex lg:hidden items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-none shrink-0"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="mt-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 p-4 backdrop-blur-xl shadow-2xl space-y-4 animate-in slide-in-from-top-2 duration-200 lg:hidden">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm AI, CapCut, TikTok, FB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 pl-10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          </form>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Link href="/#catalog" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <span>🛍️ Kho Hàng</span>
            </Link>
            <Link href="/topup" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <span>🎁 Nạp Ví (+5%)</span>
            </Link>
            <Link href="/lookup" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <span>🔍 Tra Cứu Đơn</span>
            </Link>
            <Link href="/codex" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <span>⚡ API Quota</span>
            </Link>
            <Link href="/check-usage" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors col-span-2 text-blue-600 dark:text-blue-400">
              <span>📊 Kiểm Tra Dung Lượng API Claude / Cursor</span>
            </Link>
            <Link href="/huong-dan/codex" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors col-span-2 font-bold">
              <span>🚀 Hướng Dẫn Kích Hoạt Codex API (1-Click)</span>
            </Link>
            <Link href="/huong-dan/api-claude" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors col-span-2 font-bold">
              <span>📖 Hướng Dẫn Cấu Hình API Claude</span>
            </Link>
            <Link href="/tools/prompt-master" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors col-span-2 text-purple-600 dark:text-purple-400">
              <span>✨ Prompt AI Master</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
            {user ? (
              <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>{user.username} ({user.balance.toLocaleString("vi-VN")}đ)</span>
              </Link>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                Đăng nhập tài khoản →
              </Link>
            )}
            <span className="text-[10px] text-slate-400 font-mono">Daitruong Store</span>
          </div>
        </div>
      )}
    </header>
  );
}
