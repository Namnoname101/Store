"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  MessageCircle,
  PhoneCall,
  Send,
  HelpCircle,
  Layers,
  Loader2,
  Clock,
  AlertCircle,
  Terminal,
  Laptop,
  Code2,
  ArrowRight,
  Sparkles,
  Activity,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Product } from "@prisma/client";
import { playSuccessChime } from "@/lib/sound";
import ClaudeApiGuideHub from "@/components/ClaudeApiGuideHub";
import CodexApiGuideHub from "@/components/CodexApiGuideHub";
import { saveRecentOrder } from "@/lib/order-storage";
import BuffProgressCard from "@/components/BuffProgressCard";
import BrandLogo from "@/components/BrandLogo";
import {
  InstructionGuide,
  resolveProductInstruction,
} from "@/lib/product-guides";

export type { InstructionGuide };

export function getProductInstructions(
  type: string,
  title?: string,
  rawSecret?: string,
  slug?: string
): InstructionGuide {
  return resolveProductInstruction({ slug, title, type, rawSecret });
}

export function parseSecretItem(
  content: string,
  type?: string
): {
  isAccount: boolean;
  username?: string;
  password?: string;
  raw: string;
} {
  if (!content) {
    return { isAccount: false, raw: "" };
  }

  const trimmed = content.trim();

  // If designated as ACCOUNT or follows format `username|password` or `username:password`
  if (type === "ACCOUNT" || trimmed.includes("|")) {
    const parts = trimmed.split("|");
    if (parts.length >= 2) {
      const u = parts[0].trim().replace(/^[`'"]+|[`'"]+$/g, "");
      const p = parts.slice(1).join("|").trim().replace(/^[`'"]+|[`'"]+$/g, "");
      return {
        isAccount: true,
        username: u,
        password: p,
        raw: trimmed,
      };
    }
  }

  return {
    isAccount: false,
    raw: trimmed,
  };
}

export function maskSecret(content: string, type?: string): string {
  if (!content) return "";
  if (content.startsWith("sk-")) {
    const prefix = content.slice(0, 7);
    const suffix = content.slice(-4);
    return `${prefix}••••••••••••••••••••${suffix}`;
  }
  if (type === "ACCOUNT" || content.includes("|")) {
    return "••••••••••••••••";
  }
  if (content.length > 10) {
    return `${content.slice(0, 4)}-•••••-•••••-${content.slice(-4)}`;
  }
  return "••••••••••••";
}

export interface SecretDisplayProps {
  orderCode?: string;
  upstreamStatus?: string;
  refundInfo?: string | null;
  accessToken?: string | null;
  deliveredItems: Array<{
    id: string;
    productId: string;
    secretContent?: string;
    status: string;
  }>;
  orderItems: Array<{
    id: string;
    productId: string;
    price: number;
    quantity: number;
    product: Partial<Product>;
  }>;
}

export default function SecretDisplay({
  orderCode,
  upstreamStatus,
  refundInfo,
  accessToken,
  deliveredItems,
  orderItems,
}: SecretDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [activeEnvTab, setActiveEnvTab] = useState<"cursor" | "vscode" | "cli">("cursor");

  const [currentUpstreamStatus, setCurrentUpstreamStatus] = useState<
    string | undefined
  >(upstreamStatus);
  const [currentRefundInfo, setCurrentRefundInfo] = useState<any>(() => {
    if (refundInfo) {
      try {
        return typeof refundInfo === "string"
          ? JSON.parse(refundInfo)
          : refundInfo;
      } catch {
        return { raw: refundInfo };
      }
    }
    return null;
  });

  // Filter out any leaked system error notices so customers never see raw balance or bot errors
  const validDeliveredItems = useMemo(() => {
    return (deliveredItems || []).filter((item) => {
      const c = item.secretContent || "";
      const isError =
        c.includes("❌") ||
        /(?:số dư|ví)[^.]*không đủ/i.test(c) ||
        /(?:thất bại|lỗi kết nối|nạp thêm tiền)/i.test(c);
      return !isError && c.trim().length > 0;
    });
  }, [deliveredItems]);

  const isBuffService = Boolean(
    orderItems?.some(
      (item) =>
        (item.product?.fulfillmentType && item.product.fulfillmentType !== "LOCAL_STOCK") ||
        (item.product as any)?.category?.slug?.includes("buff") ||
        (item.product as any)?.category?.slug?.includes("dich-vu") ||
        item.product?.type === "COURSE_LINK"
    )
  );

  // Refund Form State
  const [refundBank, setRefundBank] = useState<string>("");
  const [refundAccountNo, setRefundAccountNo] = useState<string>("");
  const [refundAccountName, setRefundAccountName] = useState<string>("");
  const [refundNote, setRefundNote] = useState<string>("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState<boolean>(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);

  // Play chime and save recent order on success page arrival
  useEffect(() => {
    if (orderCode) {
      playSuccessChime();
      const itemsSummary =
        orderItems?.map((i) => i.product?.title || "Sản phẩm").join(", ") ||
        "Sản phẩm số";
      const totalAmount =
        orderItems?.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0) || 0;
      saveRecentOrder({
        orderCode,
        totalAmount,
        createdAt: new Date().toISOString(),
        itemsSummary,
        status: "PAID",
      });
    }
  }, [orderCode, orderItems]);

  // Auto-polling when PENDING_UPSTREAM, PENDING_MANUAL, or awaiting delivered items
  useEffect(() => {
    const isWaiting =
      currentUpstreamStatus === "PENDING_UPSTREAM" ||
      currentUpstreamStatus === "PENDING_MANUAL" ||
      !validDeliveredItems ||
      validDeliveredItems.length === 0;

    if (isWaiting && orderCode) {
      const interval = setInterval(async () => {
        try {
          const tokenQuery = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
          const res = await fetch(`/api/orders/${orderCode}/status${tokenQuery}`);
          if (res.ok) {
            const data = await res.json();
            if (
              data.upstreamStatus &&
              data.upstreamStatus !== currentUpstreamStatus
            ) {
              setCurrentUpstreamStatus(data.upstreamStatus);
            }
            if (data.refundInfo && !currentRefundInfo) {
              setCurrentRefundInfo(data.refundInfo);
            }
            if (
              data.upstreamStatus === "COMPLETED" ||
              (data.deliveredItems && data.deliveredItems.length > 0)
            ) {
              playSuccessChime();
              window.location.reload();
            }
          }
        } catch {
          // Silently retry on next tick
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUpstreamStatus, currentRefundInfo, orderCode, validDeliveredItems, accessToken]);

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode) return;
    setRefundError(null);

    if (
      !refundBank.trim() ||
      !refundAccountNo.trim() ||
      !refundAccountName.trim()
    ) {
      setRefundError(
        "Vui lòng điền đầy đủ tên ngân hàng, số tài khoản và họ tên chủ tài khoản."
      );
      return;
    }

    setIsSubmittingRefund(true);
    try {
      const res = await fetch(`/api/orders/${orderCode}/refund-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: refundBank.trim(),
          accountNumber: refundAccountNo.trim(),
          accountName: refundAccountName.trim(),
          note: refundNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRefundError(
          data.error || "Không thể gửi yêu cầu hoàn tiền. Vui lòng thử lại."
        );
      } else {
        setRefundSuccessMsg(
          data.message ||
            "Yêu cầu hoàn tiền của bạn đã được ghi nhận. Nhân viên CSKH sẽ chuyển khoản lại theo thông tin đã cung cấp."
        );
        setCurrentRefundInfo({
          bankName: refundBank.trim(),
          accountNumber: refundAccountNo.trim(),
          accountName: refundAccountName.trim().toUpperCase(),
          note: refundNote.trim(),
          requestedAt: new Date().toISOString(),
        });
      }
    } catch {
      setRefundError("Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Map product info by productId
  const productMap = new Map(
    orderItems.map((item) => [item.productId, item.product])
  );

  const handleCopy = async (id: string, text: string, label: string = "thông tin") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setToastMessage(`Đã sao chép ${label} vào bộ nhớ tạm!`);
      setTimeout(() => setCopiedId(null), 2000);
      setTimeout(() => setToastMessage(null), 2500);
    } catch {
      setCopiedId(id);
      setToastMessage(`Đã sao chép ${label}!`);
      setTimeout(() => setCopiedId(null), 2000);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleDownloadTxt = () => {
    let content = "=======================================================\n";
    content += "KHODEE V2 - BIÊN BẢN BÀN GIAO SẢN PHẨM SỐ & DỊCH VỤ AI\n";
    content += `Mã đơn hàng: #${orderCode || "ONLINE"}\n`;
    content += `Thời gian xuất: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}\n`;
    content += "Trạng thái: ĐÃ THANH TOÁN & BÀN GIAO CHÍNH THỨC\n";
    content += "=======================================================\n\n";

    validDeliveredItems.forEach((item, idx) => {
      const product = productMap.get(item.productId);
      const parsed = parseSecretItem(item.secretContent || "", product?.type);
      content += `[MỤC ${idx + 1}]: ${product?.title || "Sản phẩm kỹ thuật số"}\n`;
      if (parsed.isAccount && parsed.username && parsed.password) {
        content += `  - Tài khoản / Email: ${parsed.username}\n`;
        content += `  - Mật khẩu: ${parsed.password}\n`;
        content += `  - Cú pháp gộp: ${parsed.raw}\n`;
      } else {
        content += `  - Mã bàn giao / Key: ${item.secretContent || ""}\n`;
        if (item.secretContent?.startsWith("sk-")) {
          content += `  - Endpoint Base URL: https://daitruongstore.fly.dev/v1\n`;
          content += `  - Tra cứu Quota & Logs: https://daitruongstore.fly.dev/developer/usage\n`;
        }
      }
      content += "\n";
    });

    if (instructions?.steps?.length) {
      content += "=======================================================\n";
      content += "HƯỚNG DẪN KÍCH HOẠT / SỬ DỤNG:\n";
      instructions.steps.forEach((step, idx) => {
        const text = typeof step === "object" && step !== null ? step.text : String(step);
        content += `${idx + 1}. ${text}\n`;
      });
      content += "=======================================================\n";
    }

    content += "\nCHÍNH SÁCH BẢO HÀNH & HỖ TRỢ:\n";
    content += "- Bảo hành 1-đổi-1 theo đúng chính sách và thời hạn của từng gói sản phẩm.\n";
    content += "- Hỗ trợ kỹ thuật 24/7 qua Telegram: https://t.me/daitruongstore\n";
    content += "- Website chính thức: https://daitruongstore.fly.dev\n";

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `KhoDEE_${orderCode || "delivery"}_ban-giao.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = async () => {
    const allSecrets = validDeliveredItems
      .map((item) => item.secretContent)
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(allSecrets);
      setCopiedAll(true);
      setToastMessage("Đã sao chép tất cả mã bàn giao!");
      setTimeout(() => setCopiedAll(false), 2000);
      setTimeout(() => setToastMessage(null), 2500);
    } catch {
      setCopiedAll(true);
      setToastMessage("Đã sao chép tất cả mã bàn giao!");
      setTimeout(() => setCopiedAll(false), 2000);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // CASE 1: PENDING_UPSTREAM (Progress alert with spinning loader)
  if (currentUpstreamStatus === "PENDING_UPSTREAM") {
    if (isBuffService) {
      return (
        <div className="space-y-6">
          <BuffProgressCard orderCode={orderCode} />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground p-8 sm:p-10 shadow-sm text-center">
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-secondary border border-border px-3.5 py-1 text-xs font-mono font-medium text-foreground mb-3 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Máy chủ đang cấp phát tự động...</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-2">
              Đang Khởi Tạo & Cấp Key Bản Quyền
            </h3>

            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed mb-6">
              Hệ thống đang kết nối trực tiếp với cổng dịch vụ để xuất mã key cho đơn hàng{" "}
              <span className="font-mono font-semibold text-foreground">#{orderCode}</span>.
            </p>

            <div className="w-full max-w-md mx-auto mb-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary border border-border">
                <div className="h-full w-full bg-gradient-to-r from-primary/40 via-emerald-500 to-primary/40 animate-pulse" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-mono">
              Thời gian xử lý: 3 - 10 giây. Trang sẽ tự động làm mới khi hoàn tất.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // CASE 2: FAILED Status & Self-Service Refund Form
  if (currentUpstreamStatus === "FAILED") {
    return (
      <div className="space-y-6">
        {/* Issue Notification */}
        <div className="rounded-2xl border border-amber-500/30 bg-card text-card-foreground p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 font-mono">
                <span>HỆ THỐNG CẤP PHÁT</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">
                Cấp phát tạm thời bị gián đoạn
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Máy chủ cấp phát đang quá tải. Đơn hàng của bạn được bảo đảm an toàn 100%. Bạn có thể gửi thông tin tài khoản bên dưới để nhận hoàn tiền ngay lập tức hoặc chờ hỗ trợ.
              </p>
            </div>
          </div>
        </div>

        {/* Existing refund request or self-service form */}
        {currentRefundInfo || refundSuccessMsg ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-card text-card-foreground p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-foreground">
                  Đã ghi nhận yêu cầu hoàn tiền
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Đội ngũ CSKH sẽ đối soát và chuyển khoản hoàn lại trong vòng 5-15 phút.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Ngân hàng:</span>
                <span className="font-semibold text-foreground">
                  {currentRefundInfo?.bankName || refundBank}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Số tài khoản:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentRefundInfo?.accountNumber || refundAccountNo}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chủ tài khoản:</span>
                <span className="font-semibold text-foreground uppercase">
                  {currentRefundInfo?.accountName || refundAccountName}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h4 className="text-base font-bold text-foreground mb-1">
                Yêu cầu hoàn tiền 100% tự động
              </h4>
              <p className="text-xs text-muted-foreground">
                Nhập số tài khoản ngân hàng để hệ thống hoàn lại tiền cho bạn:
              </p>
            </div>

            {refundError && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                <span>{refundError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Tên ngân hàng thụ hưởng <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={refundBank}
                  onChange={(e) => setRefundBank(e.target.value)}
                  placeholder="Ví dụ: MBBank, Vietcombank, Techcombank..."
                  className="min-h-[44px] w-full rounded-xl border border-input bg-secondary px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Số tài khoản ngân hàng <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={refundAccountNo}
                    onChange={(e) => setRefundAccountNo(e.target.value)}
                    placeholder="Nhập số tài khoản..."
                    className="min-h-[44px] w-full font-mono rounded-xl border border-input bg-secondary px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Họ và tên chủ tài khoản <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={refundAccountName}
                    onChange={(e) => setRefundAccountName(e.target.value)}
                    placeholder="Ví dụ: NGUYEN VAN A"
                    className="min-h-[44px] w-full uppercase rounded-xl border border-input bg-secondary px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Ghi chú thêm (tùy chọn)
                </label>
                <input
                  type="text"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="Ghi chú thêm nếu có..."
                  className="min-h-[44px] w-full rounded-xl border border-input bg-secondary px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="min-h-[44px] flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-6 text-xs font-bold transition-all shadow-sm disabled:opacity-50 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {isSubmittingRefund ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                      <span>Đang gửi thông tin...</span>
                    </>
                  ) : (
                    <span>Gửi yêu cầu hoàn tiền ngay</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Fallback if no delivered items yet (Waiting for manual key fulfillment or upstream generation)
  if (!validDeliveredItems || validDeliveredItems.length === 0) {
    const isClaudeOrder = orderItems?.some((item) => {
      const slug = (item.product?.slug || "").toLowerCase();
      const title = (item.product?.title || "").toLowerCase();
      return slug.includes("claude") || slug.startsWith("cla-") || title.includes("claude");
    });

    const isCodexOrder = orderItems?.some((item) => {
      const slug = (item.product?.slug || "").toLowerCase();
      const title = (item.product?.title || "").toLowerCase();
      return slug.includes("codex") || slug.startsWith("cdx") || title.includes("codex");
    });

    return (
      <div className="space-y-6">
        <BuffProgressCard orderCode={orderCode} />
        {!isBuffService && (
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-card to-card p-6 sm:p-8 text-center shadow-lg backdrop-blur-md">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-amber-500/60 blur-xs rounded-full" />

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 ring-8 ring-amber-500/5">
              <Clock className="h-8 w-8 animate-pulse text-amber-600 dark:text-amber-300" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-3.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 mb-3 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>ĐÃ THANH TOÁN THÀNH CÔNG • ĐANG CẤP PHÁT MÃ</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground mb-2 tracking-tight">
              Đang chuẩn bị mã riêng cho bạn... 🚀
            </h3>

            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Bạn vui lòng đợi trong giây lát nha! Shop đang cập nhật key thủ công riêng cho đơn hàng này, cập nhật xong hệ thống sẽ{" "}
              <strong className="text-amber-700 dark:text-amber-300 font-semibold">tự động hiển thị mã ngay tại màn hình này</strong> mà không cần bấm tải lại trang!
            </p>

            {/* Status pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-secondary/80 border border-border px-3.5 py-2 text-foreground">
                <span className="text-muted-foreground">Mã đơn hàng:</span>
                <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">#{orderCode}</strong>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-secondary/80 border border-border px-3.5 py-2 text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Tự động kiểm tra trực tiếp (Auto-live 3s)</span>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-secondary/80 border border-border px-3.5 py-2 text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Thời gian xử lý: 1 - 5 phút</span>
              </div>
            </div>

            {/* Telegram help link */}
            <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>Cần nhận hỗ trợ gấp?</span>
              <a
                href={`https://t.me/daitruongstore?text=${encodeURIComponent(`Chào shop, mình cần hỗ trợ đơn hàng #${orderCode}`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Nhắn tin qua Telegram Shop (Hỗ trợ 24/7)</span>
              </a>
            </div>
          </div>
        )}

        {/* Preview guide while customer waits */}
        {isClaudeOrder && (
          <div className="mt-8 space-y-4 text-left">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Trong lúc đợi, bạn có thể xem trước hướng dẫn kết nối API Claude (Hỗ trợ 5 nền tảng):</span>
            </div>
            <ClaudeApiGuideHub compactMode={false} showKeyInput={false} />
          </div>
        )}

        {isCodexOrder && (
          <div className="mt-8 space-y-4 text-left">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span>Trong lúc đợi, bạn có thể xem trước hướng dẫn cấu hình API Codex:</span>
            </div>
            <CodexApiGuideHub showKeyInput={false} />
          </div>
        )}
      </div>
    );
  }

  // Determine dominant product type for instruction box
  const primaryProduct = productMap.get(validDeliveredItems[0].productId);
  const primaryType = primaryProduct?.type || "LICENSE_KEY";
  const primaryTitle = primaryProduct?.title || "";
  const primarySlug = (primaryProduct as any)?.slug || "";
  const firstSecret = validDeliveredItems[0]?.secretContent || "";
  const instructions = getProductInstructions(primaryType, primaryTitle, firstSecret, primarySlug);

  const isCodexProduct =
    primarySlug.toLowerCase().includes("codex") ||
    primaryTitle.toLowerCase().includes("codex");

  const isApiKeyProduct =
    primarySlug.includes("api") ||
    primarySlug.includes("claude") ||
    primarySlug.includes("cursor") ||
    primarySlug.includes("codex") ||
    primaryTitle.toLowerCase().includes("api") ||
    firstSecret.startsWith("sk-");

  return (
    <div className="space-y-6">
      <BuffProgressCard orderCode={orderCode} />

      {/* Top action bar: Quick download & copy actions */}
      {validDeliveredItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card text-card-foreground px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-foreground">
              Dữ liệu bàn giao ({validDeliveredItems.length} mục)
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-ring"
              title="Tải tệp .txt lưu trữ về máy"
            >
              <Download className="h-4 w-4 text-primary" />
              <span>Tải file .TXT</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className={`min-h-[44px] flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-ring ${
                copiedAll
                  ? "bg-emerald-600 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {copiedAll ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Đã sao chép tất cả!</span>
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  <span>Sao chép tất cả</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Delivered items list - Tech Studio Aesthetic */}
      <div className="space-y-3.5">
        {validDeliveredItems.map((item, index) => {
          const product = productMap.get(item.productId);
          const secretContent = item.secretContent || "";
          const parsed = parseSecretItem(secretContent, product?.type);
          const isCopied = copiedId === item.id;
          const isUsernameCopied = copiedId === `${item.id}-user`;
          const isPasswordCopied = copiedId === `${item.id}-pass`;

          return (
            <div
              key={item.id || index}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs text-card-foreground transition-all duration-200"
            >
              {/* Item header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary border border-border text-[11px] font-mono font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    {product?.title || "Sản phẩm kỹ thuật số"}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Đã bàn giao
                </span>
              </div>

              {/* Secret display content based on format */}
              {parsed.isAccount && parsed.username && parsed.password ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Username Box */}
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5">
                      <div className="min-w-0">
                        <span className="block text-[10px] uppercase font-mono font-semibold text-muted-foreground">
                          Tài khoản / Email
                        </span>
                        <span className="block font-mono text-xs sm:text-sm font-semibold text-foreground truncate select-all">
                          {parsed.username}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(`${item.id}-user`, parsed.username!, "tài khoản")}
                        className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 rounded-xl px-3 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-ring ${
                          isUsernameCopied
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                        }`}
                        title="Sao chép tài khoản"
                        aria-label="Sao chép tài khoản"
                      >
                        {isUsernameCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Password Box with Masked Secret Toggle */}
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5">
                      <div className="min-w-0">
                        <span className="block text-[10px] uppercase font-mono font-semibold text-muted-foreground">
                          Mật khẩu
                        </span>
                        <span className="block font-mono text-xs sm:text-sm font-semibold text-foreground truncate select-all">
                          {revealedSecrets[`${item.id}-pass`]
                            ? parsed.password
                            : "••••••••••••••••"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleReveal(`${item.id}-pass`)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-ring border border-border"
                          aria-label={revealedSecrets[`${item.id}-pass`] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          title={revealedSecrets[`${item.id}-pass`] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {revealedSecrets[`${item.id}-pass`] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(`${item.id}-pass`, parsed.password!, "mật khẩu")}
                          className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 rounded-xl px-3 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-ring ${
                            isPasswordCopied
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                          }`}
                          title="Sao chép mật khẩu"
                          aria-label="Sao chép mật khẩu"
                        >
                          {isPasswordCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Combined Copy */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, secretContent, "trọn bộ tài khoản")}
                      className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors rounded-xl focus-visible:ring-2 focus-visible:ring-ring ${
                        isCopied ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Đã sao chép trọn bộ (user|pass)!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Sao chép cả tài khoản & mật khẩu (dạng user|pass)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : product?.type === "COURSE_LINK" || secretContent.startsWith("http") ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/50 p-3.5">
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase font-mono font-semibold text-muted-foreground mb-0.5">
                      Đường dẫn truy cập
                    </span>
                    <a
                      href={secretContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline truncate block select-all"
                    >
                      {secretContent}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={secretContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Mở link</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, secretContent, "đường dẫn")}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-ring ${
                        isCopied
                          ? "bg-emerald-600 text-white"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Đã chép</span>
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
              ) : (
                /* Standard License Key box - Tech Studio Style with Masked Secret Toggle */
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase font-mono font-semibold text-muted-foreground mb-1">
                      MÃ KEY BẢN QUYỀN / API TOKEN
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-primary tracking-wider break-all select-all">
                      {revealedSecrets[item.id]
                        ? secretContent
                        : maskSecret(secretContent, product?.type)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleReveal(item.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-border bg-secondary text-foreground hover:bg-secondary/80 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={revealedSecrets[item.id] ? "Ẩn mã bí mật" : "Hiện mã bí mật"}
                      title={revealedSecrets[item.id] ? "Ẩn mã bí mật" : "Hiện mã bí mật"}
                    >
                      {revealedSecrets[item.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>

                    {secretContent.startsWith("sk-") && (
                      <Link
                        href={`/developer/usage?key=${encodeURIComponent(secretContent)}`}
                        className="min-h-[44px] flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3.5 py-2 text-xs font-semibold text-primary transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-ring"
                        title="Kiểm tra hạn mức quota và log request thời gian thực của Key này"
                      >
                        <Terminal className="h-4 w-4" />
                        <span>Xem Quota & Logs</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, secretContent, "mã key")}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-ring ${
                        isCopied
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                      }`}
                      aria-label="Sao chép Key"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Sao chép Key</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions Guide Box */}
      {isCodexProduct ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{instructions.title || "Hướng dẫn cấu hình Codex AI"}</span>
            </h4>
            <Link
              href="/huong-dan/codex"
              target="_blank"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span>Mở trang hướng dẫn Codex đầy đủ</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <CodexApiGuideHub apiKey={firstSecret} showKeyInput={false} />
        </div>
      ) : isApiKeyProduct ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{instructions.title}</span>
            </h4>
            <Link
              href="/huong-dan/api-claude"
              target="_blank"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span>Mở trang hướng dẫn toàn màn hình</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <ClaudeApiGuideHub apiKey={firstSecret} showKeyInput={false} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card text-card-foreground p-5 sm:p-6 shadow-sm">
          <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span>{instructions.title}</span>
          </h4>

          <div className="space-y-4">
            {instructions.steps.map((stepItem, idx) => {
              const isObj = typeof stepItem === "object" && stepItem !== null;
              const text = isObj ? stepItem.text : String(stepItem);
              const image = isObj ? stepItem.image : undefined;
              const caption = isObj ? stepItem.caption : undefined;

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary border border-border text-foreground font-mono font-bold text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-0.5">
                      {text}
                    </div>
                  </div>

                  {image && (
                    <div className="ml-7 sm:ml-8 mt-2">
                      <a
                        href={image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block overflow-hidden rounded-xl border border-border bg-muted/40 transition-all hover:border-primary/50 max-w-xl"
                        title="Bấm để xem ảnh kích thước lớn"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={caption || `Minh họa bước ${idx + 1}`}
                          className="max-h-72 sm:max-h-80 w-auto rounded-t-lg object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                          loading="lazy"
                        />
                        {caption && (
                          <div className="px-3 py-2 text-[11px] text-muted-foreground bg-secondary/80 border-t border-border flex items-center justify-between">
                            <span>📸 {caption}</span>
                            <span className="text-[10px] text-primary font-medium group-hover:underline">
                              Xem ảnh lớn ↗
                            </span>
                          </div>
                        )}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Optional general screenshots gallery if instructions.images provided */}
          {instructions.images && instructions.images.length > 0 && (
            <div className="mt-6 pt-5 border-t border-border space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block font-mono">
                Hình ảnh chụp màn hình minh họa:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {instructions.images.map((img, imgIdx) => (
                  <a
                    key={imgIdx}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block overflow-hidden rounded-xl border border-border bg-muted/40 transition-all hover:border-primary/50"
                  >
                    <img
                      src={img.url}
                      alt={img.title || `Hình minh họa ${imgIdx + 1}`}
                      className="h-44 w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    {img.title && (
                      <div className="p-2 text-[11px] text-foreground bg-card/90">
                        {img.title}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {instructions.note && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              ⚠️ <strong className="font-semibold text-amber-900 dark:text-amber-200">Lưu ý:</strong> {instructions.note}
            </div>
          )}
        </div>
      )}

      {/* 24/7 Customer Support Assistance Box */}
      <div className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Bảo hành 1-đổi-1 & Hỗ trợ kỹ thuật 24/7</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Đội ngũ kỹ thuật viên KhoDEE sẵn sàng hỗ trợ bạn qua Telegram 24/7.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://t.me/daitruongstore?text=${encodeURIComponent(`Xin chào KhoDEE, tôi cần hỗ trợ đơn hàng ${orderCode || ""}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] flex items-center gap-2 rounded-xl bg-[#0088cc] hover:bg-[#0088cc]/90 px-4 py-2 text-xs font-semibold text-white transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Send className="h-4 w-4" />
              <span>Liên hệ Telegram CSKH</span>
            </a>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-card/95 text-card-foreground px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
