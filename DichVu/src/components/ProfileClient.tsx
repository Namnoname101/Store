"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  User,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  LogOut,
  PlusCircle,
  Receipt,
  ExternalLink,
  Shield,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  TrendingUp,
} from "lucide-react";

function getMemberTier(totalDeposited: number, role?: string) {
  if (role === "ADMIN") {
    return {
      label: "Quản trị viên",
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800",
    };
  }
  if (totalDeposited >= 50000000) {
    return {
      label: "VIP Kim Cương",
      color: "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800",
    };
  }
  if (totalDeposited >= 20000000) {
    return {
      label: "Thành viên Vàng",
      color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
    };
  }
  if (totalDeposited >= 5000000) {
    return {
      label: "Thành viên Bạc",
      color: "text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700",
    };
  }
  if (totalDeposited >= 1000000) {
    return {
      label: "Thành viên Đồng",
      color: "text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700",
    };
  }
  return {
    label: "Thành viên Mới",
    color: "text-muted-foreground bg-muted border-border",
  };
}

export default function ProfileClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wallet" | "orders">("wallet");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [copiedSecretId, setCopiedSecretId] = useState<string | null>(null);
  const router = useRouter();

  const handleCopySecret = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecretId(id);
    setTimeout(() => setCopiedSecretId(null), 2000);
  };

  const toggleSecretReveal = (id: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
          // Fetch history
          fetch("/api/wallet/history")
            .then((r) => r.json())
            .then((hData) => {
              if (hData?.success) {
                setTransactions(hData.transactions || []);
                setOrders(hData.orders || []);
              }
            })
            .finally(() => setLoadingHistory(false));
        } else {
          router.push("/login?callbackUrl=/profile");
        }
      })
      .catch(() => router.push("/login?callbackUrl=/profile"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const memberTier = getMemberTier(user?.totalDeposited || 0, user?.role);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-foreground">
      {/* User Header Profile Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs mb-8 text-card-foreground">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-cyan-500 p-0.5 shadow-xs">
              <div className="h-full w-full rounded-[14px] bg-card flex items-center justify-center text-foreground text-xl font-bold border border-border">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl font-bold text-foreground">{user?.username}</h1>
                <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold border ${memberTier.color}`}>
                  {memberTier.label}
                </span>
                {user?.role === "ADMIN" && (
                  <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.email || "Chưa cập nhật email"} • Tham gia từ {new Date(user?.createdAt).toLocaleDateString("vi-VN")}
              </p>
              <div className="mt-2">
                <Link
                  href="/dashboard/affiliate"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Chương trình Tiếp thị Liên kết (CTV / Affiliate) →</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Balance Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/30 px-4 py-2.5">
              <div className="text-[11px] text-emerald-800 dark:text-emerald-400 uppercase font-semibold">Số dư ví khả dụng</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-300">
                {(user?.balance ?? 0).toLocaleString("vi-VN")}đ
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 px-4 py-2.5">
              <div className="text-[11px] text-muted-foreground uppercase font-medium">Tổng tiền đã nạp</div>
              <div className="text-xl font-bold text-foreground">
                {(user?.totalDeposited ?? 0).toLocaleString("vi-VN")}đ
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/topup"
                className="min-h-[44px] flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-all active:scale-95"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Nạp tiền</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all cursor-pointer"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-border pb-3 mb-6">
        <button
          onClick={() => setActiveTab("wallet")}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "wallet"
              ? "border border-primary bg-primary text-primary-foreground shadow-xs font-bold"
              : "border border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground font-semibold"
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Biến động số dư ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "orders"
              ? "border border-primary bg-primary text-primary-foreground shadow-xs font-bold"
              : "border border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground font-semibold"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Đơn hàng đã mua ({orders.length})</span>
        </button>
      </div>

      {/* Tab 1: Wallet Transactions */}
      {activeTab === "wallet" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs text-card-foreground">
          {loadingHistory ? (
            <div className="p-8 text-center text-muted-foreground">Đang tải lịch sử giao dịch ví...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground mb-1">Chưa có giao dịch ví nào</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Hãy nạp tiền vào ví để mua dịch vụ và theo dõi lịch sử số dư tại đây.
              </p>
              <Link
                href="/topup"
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-xs transition"
              >
                Nạp tiền ngay
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Loại GD</th>
                    <th className="py-3 px-4">Số tiền</th>
                    <th className="py-3 px-4">Số dư sau GD</th>
                    <th className="py-3 px-4">Mã tham chiếu</th>
                    <th className="py-3 px-4">Diễn giải</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                              tx.type === "TOPUP"
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : tx.type === "ORDER_PAYMENT"
                                ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                : tx.type === "REFUND"
                                ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                                : "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            }`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                            {tx.type === "TOPUP"
                              ? "Nạp tiền"
                              : tx.type === "ORDER_PAYMENT"
                              ? "Thanh toán"
                              : tx.type === "REFUND"
                              ? "Hoàn tiền"
                              : "Điều chỉnh"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                          <span className={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                            {isPositive ? "+" : ""}
                            {tx.amount.toLocaleString("vi-VN")}đ
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground whitespace-nowrap">
                          {tx.balanceAfter.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-primary font-semibold">
                          {tx.referenceId || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {tx.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Purchased Orders */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="p-8 text-center text-muted-foreground">Đang tải danh sách đơn hàng...</div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-xs text-card-foreground">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground mb-1">Chưa có đơn hàng nào</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Bạn chưa thực hiện đơn mua dịch vụ nào qua tài khoản này.
              </p>
              <Link
                href="/#catalog"
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-xs transition"
              >
                Khám phá dịch vụ
              </Link>
            </div>
          ) : (
            orders.map((ord) => {
              const statusBadgeConfig: Record<string, { label: string; cls: string }> = {
                PAID: {
                  label: "Đã thanh toán",
                  cls: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
                },
                PENDING: {
                  label: "Chờ thanh toán",
                  cls: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
                },
                CANCELLED: {
                  label: "Đã hủy",
                  cls: "bg-muted text-muted-foreground border-border",
                },
                EXPIRED: {
                  label: "Hết hạn",
                  cls: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
                },
                REFUNDED: {
                  label: "Đã hoàn tiền",
                  cls: "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
                },
              };

              const currentStatus = statusBadgeConfig[ord.status] || {
                label: ord.status,
                cls: "bg-muted text-muted-foreground border-border",
              };

              const targetUrl =
                ord.status === "PENDING"
                  ? `/checkout/${ord.orderCode}`
                  : `/order-success/${ord.orderCode}`;

              const targetLabel =
                ord.status === "PENDING" ? "Thanh toán ngay" : "Chi tiết đơn hàng";

              return (
                <div
                  key={ord.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-xs text-card-foreground flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-mono text-sm font-bold text-foreground">{ord.orderCode}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${currentStatus.cls}`}>
                        {currentStatus.label}
                      </span>
                      {ord.paymentMethod === "WALLET" && (
                        <span className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-medium">
                          Ví số dư
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(ord.createdAt).toLocaleString("vi-VN")} •{" "}
                      {ord.orderItems?.map((i: any) => i.product?.title).join(", ") || "Dịch vụ số"}
                    </div>

                    {ord.deliveredItems && ord.deliveredItems.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {ord.deliveredItems.map((item: any, idx: number) => {
                          const secretId = `${ord.id}-${idx}`;
                          const isRevealed = Boolean(revealedSecrets[secretId]);
                          const secretText = item.secretContent || "";
                          const isCopied = copiedSecretId === secretId;

                          return (
                            <div
                              key={secretId}
                              className="flex items-center flex-wrap gap-2 rounded-lg border border-border bg-muted/40 p-2 text-xs font-mono"
                            >
                              <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                                <Key className="h-3.5 w-3.5 text-primary" />
                                <span className="font-sans text-[11px] font-semibold">Tài khoản / Key:</span>
                              </div>
                              <span className="font-mono font-bold text-foreground break-all select-all flex-1 min-w-[120px]">
                                {isRevealed ? secretText : "••••••••••••••••••••"}
                              </span>
                              <div className="flex items-center gap-1 shrink-0 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => toggleSecretReveal(secretId)}
                                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition"
                                  title={isRevealed ? "Ẩn thông tin" : "Hiện thông tin"}
                                  aria-label={isRevealed ? "Ẩn thông tin tài khoản" : "Hiện thông tin tài khoản"}
                                >
                                  {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopySecret(secretId, secretText)}
                                  className="min-h-[44px] px-3 inline-flex items-center gap-1 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition text-xs font-sans font-medium"
                                  title="Sao chép"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                                      <span className="text-emerald-600 dark:text-emerald-400">Đã chép</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      <span>Sao chép</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-muted-foreground">Tổng thanh toán</div>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {ord.totalAmount.toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                    <Link
                      href={targetUrl}
                      className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
                    >
                      <span>{targetLabel}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
