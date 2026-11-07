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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 text-foreground">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-xs text-card-foreground">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 shadow-2xs">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Đăng nhập tài khoản
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Quản lý ví số dư, nạp tiền tự động và thanh toán siêu tốc 1-click
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                Tên đăng nhập hoặc Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nhập username hoặc email..."
                  className="w-full min-h-[44px] rounded-xl border border-input bg-background py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-all"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] rounded-xl border border-input bg-background py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-all"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 py-3 text-sm font-bold text-primary-foreground shadow-xs disabled:opacity-60 transition-all cursor-pointer active:scale-95"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            Chưa có tài khoản thành viên?{" "}
            <Link
              href={`/register${callbackUrl !== "/profile" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="font-semibold text-primary hover:underline transition-colors min-h-[44px] inline-flex items-center"
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
