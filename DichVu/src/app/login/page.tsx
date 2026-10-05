"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Đăng nhập không thành công");
        setLoading(false);
        return;
      }

      // Hard redirect to refresh auth cookie and session in layout
      window.location.href = callbackUrl;
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Đăng nhập tài khoản
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Quản lý ví số dư, nạp tiền tự động và thanh toán siêu tốc 1-click
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
                Tên đăng nhập hoặc Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nhập username hoặc email..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-sm text-slate-400">
            Chưa có tài khoản thành viên?{" "}
            <Link
              href={`/register${callbackUrl !== "/profile" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
