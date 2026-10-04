"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  Search,
  Shield,
  Menu,
  X,
  ShoppingBag,
  ExternalLink,
  ReceiptText,
} from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}#catalog`);
    } else {
      router.push("/#catalog");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/35 transition-all">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950/40">
                <Zap className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                DigiStore<span className="text-indigo-500">.vn</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Tự động 24/7
              </span>
            </div>
          </Link>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Tìm kiếm key Win, Office, tài khoản, khóa học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-indigo-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors"
            >
              Tìm
            </button>
          </form>
        </div>

        {/* Navigation Links - Desktop */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Trang chủ
          </Link>
          <Link
            href="/#catalog"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sản phẩm
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Quy trình mua
          </Link>
        </nav>

        {/* Actions - Desktop */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/lookup"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
          >
            <ReceiptText className="h-3.5 w-3.5 text-indigo-400" />
            <span>Tra cứu đơn</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
          >
            <Shield className="h-3.5 w-3.5 text-indigo-400" />
            <span>Quản trị</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none"
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

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-6 md:hidden">
          <form onSubmit={handleSearch} className="relative mb-4 mt-2">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm số..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          </form>

          <nav className="flex flex-col space-y-3">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-white px-2 py-1"
            >
              Trang chủ
            </Link>
            <Link
              href="/#catalog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-white px-2 py-1"
            >
              Danh mục sản phẩm
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-white px-2 py-1"
            >
              Quy trình mua hàng
            </Link>
            <Link
              href="/lookup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-base font-medium text-slate-300 hover:text-white px-2 py-1"
            >
              <ReceiptText className="h-4 w-4 text-indigo-400" />
              <span>Tra cứu đơn hàng</span>
            </Link>
            <div className="pt-2 border-t border-slate-800/80">
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Shield className="h-4 w-4 text-indigo-400" />
                <span>Trang quản trị (Admin)</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
