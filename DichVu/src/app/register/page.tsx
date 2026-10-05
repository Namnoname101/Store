"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserPlus, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      setError("Tên đăng nhập phải có ít nhất 3 ký tự");
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      setError("Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới (_)");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          email: email.trim() || undefined,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Đăng ký không thành công");
        setLoading(false);
        return;
      }

      // Hard redirect to refresh session
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
              <UserPlus className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Đăng ký tài khoản
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Tạo tài khoản để nạp tiền ví, thanh toán 1 chạm và nhận ưu đãi độc quyền
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
                Tên đăng nhập <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: quocbao99"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
                Email nhận thông báo <span className="text-slate-500 font-normal lowercase">(không bắt buộc)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
                Mật khẩu (tối thiểu 6 ký tự) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5">
                Xác nhận lại mật khẩu <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Hoàn tất đăng ký</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-sm text-slate-400">
            Đã có tài khoản?{" "}
            <Link
              href={`/login${callbackUrl !== "/profile" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
