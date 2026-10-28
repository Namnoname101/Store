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
  AlertCircle,
  Terminal,
  Laptop,
  Code2,
  ArrowRight,
} from "lucide-react";
import type { Product } from "@prisma/client";
import { playSuccessChime } from "@/lib/sound";
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

export interface SecretDisplayProps {
  orderCode?: string;
  upstreamStatus?: string;
  refundInfo?: string | null;
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

  // Auto-polling when PENDING_UPSTREAM
  useEffect(() => {
    if (currentUpstreamStatus === "PENDING_UPSTREAM" && orderCode) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/orders/${orderCode}/status`);
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
              window.location.reload();
            }
          }
        } catch {
          // Silently retry on next tick
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUpstreamStatus, currentRefundInfo, orderCode]);

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

  // Map product info by productId
  const productMap = new Map(
    orderItems.map((item) => [item.productId, item.product])
  );

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

    const handleDownloadTxt = () => {
    let content = "========================================\n";
    content += "DAITRUONG STORE - THÔNG TIN ĐƠN HÀNG #" + (orderCode || "ONLINE") + "\n";
    content += "Thời gian xuất: " + new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) + "\n";
    content += "========================================\n\n";

    validDeliveredItems.forEach((item, idx) => {
      const product = productMap.get(item.productId);
      content += "[MỤC " + (idx + 1) + "]: " + (product?.title || "Sản phẩm") + "\n";
      content += "Nội dung: " + (item.secretContent || "") + "\n\n";
    });

    if (instructions?.steps?.length) {
      content += "========================================\n";
      content += "HƯỚNG DẪN KÍCH HOẠT / SỬ DỤNG:\n";
      instructions.steps.forEach((step, idx) => {
        const text = typeof step === "object" && step !== null ? step.text : String(step);
        content += (idx + 1) + ". " + text + "\n";
      });
      content += "========================================\n";
    }

    content += "\nLưu ý: Quý khách vui lòng bảo quản thông tin bàn giao này. Mọi thắc mắc cần bảo hành 1-đổi-1 xin liên hệ bộ phận hỗ trợ khách hàng qua website.\n";

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ORD_" + (orderCode || "delivery") + ".txt";
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
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
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
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-8 sm:p-10 shadow-2xl text-center">
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-xl">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-200" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs font-mono font-medium text-zinc-300 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Máy chủ đang cấp phát tự động...</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
              Đang Khởi Tạo & Cấp Key Bản Quyền
            </h3>

            <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed mb-6">
              Hệ thống đang kết nối trực tiếp với cổng dịch vụ để xuất mã key cho đơn hàng <span className="font-mono text-zinc-200">{orderCode}</span>.
            </p>

            <div className="w-full max-w-md mx-auto mb-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                <div className="h-full w-full bg-gradient-to-r from-zinc-700 via-emerald-500 to-zinc-700 animate-pulse" />
              </div>
            </div>

            <p className="text-xs text-zinc-500 font-mono">
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
        <div className="rounded-2xl border border-amber-500/20 bg-zinc-950 p-6 sm:p-8 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400 mb-2 font-mono">
                <span>HỆ THỐNG CẤP PHÁT</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">
                Cấp phát tạm thời bị gián đoạn
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Máy chủ cấp phát đang quá tải. Đơn hàng của bạn được bảo đảm an toàn 100%. Bạn có thể gửi thông tin tài khoản bên dưới để nhận hoàn tiền ngay lập tức hoặc chờ hỗ trợ.
              </p>
            </div>
          </div>
        </div>

        {/* Existing refund request or self-service form */}
        {currentRefundInfo || refundSuccessMsg ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-zinc-950 p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Đã ghi nhận yêu cầu hoàn tiền
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Đội ngũ CSKH sẽ đối soát và chuyển khoản hoàn lại trong vòng 5-15 phút.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-zinc-500">Ngân hàng:</span>
                <span className="font-semibold text-zinc-200">
                  {currentRefundInfo?.bankName || refundBank}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-zinc-500">Số tài khoản:</span>
                <span className="font-bold text-emerald-400">
                  {currentRefundInfo?.accountNumber || refundAccountNo}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Chủ tài khoản:</span>
                <span className="font-semibold text-zinc-200 uppercase">
                  {currentRefundInfo?.accountName || refundAccountName}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-xl">
            <div className="mb-6">
              <h4 className="text-base font-bold text-white mb-1">
                Yêu cầu hoàn tiền 100% tự động
              </h4>
              <p className="text-xs text-zinc-400">
                Nhập số tài khoản ngân hàng để hệ thống hoàn lại tiền cho bạn:
              </p>
            </div>

            {refundError && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{refundError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Tên ngân hàng thụ hưởng <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={refundBank}
                  onChange={(e) => setRefundBank(e.target.value)}
                  placeholder="Ví dụ: MBBank, Vietcombank, Techcombank..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Số tài khoản ngân hàng <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={refundAccountNo}
                    onChange={(e) => setRefundAccountNo(e.target.value)}
                    placeholder="Nhập số tài khoản..."
                    className="w-full font-mono rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Họ và tên chủ tài khoản <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={refundAccountName}
                    onChange={(e) => setRefundAccountName(e.target.value)}
                    placeholder="Ví dụ: NGUYEN VAN A"
                    className="w-full uppercase rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Ghi chú thêm (tùy chọn)
                </label>
                <input
                  type="text"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="Ghi chú thêm nếu có..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 py-2.5 px-6 text-xs font-bold transition-all shadow-xs disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmittingRefund ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
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

  // Fallback if no delivered items yet
  if (!validDeliveredItems || validDeliveredItems.length === 0) {
    return (
      <div className="space-y-6">
        <BuffProgressCard orderCode={orderCode} />
        {!isBuffService && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center">
            <p className="text-sm text-zinc-400">
              Chưa có thông tin sản phẩm bàn giao cho đơn hàng này.
            </p>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-300">
              Dữ liệu bàn giao ({validDeliveredItems.length} mục)
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all shadow-xs active:scale-95"
              title="Tải tệp .txt lưu trữ về máy"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span>Tải file .TXT</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shadow-xs active:scale-95 ${
                copiedAll
                  ? "bg-emerald-600 text-white animate-spring-pop"
                  : "bg-white text-zinc-950 hover:bg-zinc-100"
              }`}
            >
              {copiedAll ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Đã sao chép tất cả!</span>
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5" />
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
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-lg transition-all duration-200 hover:border-zinc-700"
            >
              {/* Item header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-400">
                    {index + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-100">
                    {product?.title || "Sản phẩm kỹ thuật số"}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Đã bàn giao
                </span>
              </div>

              {/* Secret display content based on format */}
              {parsed.isAccount && parsed.username && parsed.password ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Username Box */}
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2">
                      <div className="min-w-0">
                        <span className="block text-[9px] uppercase font-mono font-semibold text-zinc-500">
                          Tài khoản / Email
                        </span>
                        <span className="block font-mono text-xs font-semibold text-zinc-200 truncate select-all">
                          {parsed.username}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(`${item.id}-user`, parsed.username!)}
                        className={`flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-all ${
                          isUsernameCopied
                            ? "bg-emerald-500/20 text-emerald-400 animate-spring-pop"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        }`}
                        title="Sao chép tài khoản"
                      >
                        {isUsernameCopied ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Password Box */}
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2">
                      <div className="min-w-0">
                        <span className="block text-[9px] uppercase font-mono font-semibold text-zinc-500">
                          Mật khẩu
                        </span>
                        <span className="block font-mono text-xs font-semibold text-zinc-200 truncate select-all">
                          {parsed.password}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(`${item.id}-pass`, parsed.password!)}
                        className={`flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-all ${
                          isPasswordCopied
                            ? "bg-emerald-500/20 text-emerald-400 animate-spring-pop"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        }`}
                        title="Sao chép mật khẩu"
                      >
                        {isPasswordCopied ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Chép</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Combined Copy */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, secretContent)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        isCopied ? "text-emerald-400 font-semibold" : "text-zinc-400 hover:text-white"
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] uppercase font-mono font-semibold text-zinc-500 mb-0.5">
                      Đường dẫn truy cập
                    </span>
                    <a
                      href={secretContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-blue-400 hover:underline truncate block select-all"
                    >
                      {secretContent}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={secretContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Mở link</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, secretContent)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        isCopied
                          ? "bg-emerald-600 text-white animate-spring-pop"
                          : "bg-white text-zinc-950 hover:bg-zinc-100"
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
                /* Standard License Key box - Tech Studio Style */
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3.5">
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] uppercase font-mono font-semibold text-zinc-500 mb-1">
                      MÃ KEY BẢN QUYỀN / API TOKEN
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-emerald-400 tracking-wider break-all select-all">
                      {secretContent}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {secretContent.startsWith("sk-") && (
                      <Link
                        href={`/developer/usage?key=${encodeURIComponent(secretContent)}`}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-400 transition-all shadow-2xs active:scale-[0.98]"
                        title="Kiểm tra hạn mức quota và log request thời gian thực của Key này"
                      >
                        <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Xem Quota & Logs</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, secretContent)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all shrink-0 active:scale-[0.98] ${
                        isCopied
                          ? "bg-emerald-600 text-white animate-spring-pop shadow-xs"
                          : "bg-white text-zinc-950 hover:bg-zinc-100 shadow-xs"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
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

      {/* Interactive Environment Quick Setup Tabs for Developer / AI APIs */}
      {isApiKeyProduct && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold text-white">
                Cấu hình nhanh vào công cụ lập trình (1-Click)
              </span>
            </div>

            {/* Environment Tabs */}
            <div className="flex items-center gap-1 rounded-lg bg-zinc-900 p-1 border border-zinc-800 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveEnvTab("cursor")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                  activeEnvTab === "cursor"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Laptop className="h-3 w-3 text-cyan-400" />
                <span>Cursor / Windsurf</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEnvTab("vscode")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                  activeEnvTab === "vscode"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Code2 className="h-3 w-3 text-blue-400" />
                <span>VS Code (Cline)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEnvTab("cli")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                  activeEnvTab === "cli"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Terminal className="h-3 w-3 text-emerald-400" />
                <span>Terminal / CLI</span>
              </button>
            </div>
          </div>

          {/* Terminal Mockup Code Box with macOS traffic lights */}
          <div className="rounded-lg border border-zinc-800/90 bg-zinc-900/90 overflow-hidden font-mono text-xs">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-950 border-b border-zinc-800/80 text-[10px] text-zinc-500">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 font-mono text-zinc-400">
                  {activeEnvTab === "cursor"
                    ? "Cursor Settings > Models > OpenAI API Key"
                    : activeEnvTab === "vscode"
                    ? "Cline / Roo Code Extension Settings"
                    : "bash ~/.zshrc / .bashrc"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const snippet =
                    activeEnvTab === "cursor"
                      ? `Base URL: https://modelapi.vn/v1\nAPI Key: ${firstSecret}`
                      : activeEnvTab === "vscode"
                      ? `Provider: OpenAI Compatible\nBase URL: https://modelapi.vn/v1\nAPI Key: ${firstSecret}`
                      : `export OPENAI_BASE_URL="https://modelapi.vn/v1"\nexport OPENAI_API_KEY="${firstSecret}"\nexport ANTHROPIC_BASE_URL="https://modelapi.vn/v1"\nexport ANTHROPIC_API_KEY="${firstSecret}"`;
                  handleCopy("snippet", snippet);
                }}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold transition-all ${
                  copiedId === "snippet"
                    ? "bg-emerald-600 text-white animate-spring-pop"
                    : "bg-zinc-800 text-zinc-300 hover:text-white"
                }`}
              >
                {copiedId === "snippet" ? (
                  <>
                    <Check className="h-2.5 w-2.5" />
                    <span>Đã sao chép cấu hình</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-2.5 w-2.5" />
                    <span>Sao chép mẫu</span>
                  </>
                )}
              </button>
            </div>

            {/* Terminal Body */}
            <div className="p-3.5 space-y-2 text-zinc-300 overflow-x-auto">
              {activeEnvTab === "cursor" && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-500 select-none">1.</span>
                    <span>Mở <strong className="text-white">Cursor Settings</strong> → <strong className="text-white">Models</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-500 select-none">2.</span>
                    <div>
                      <span>Đặt <strong className="text-cyan-400">Override OpenAI Base URL</strong>: </span>
                      <code className="text-emerald-400 font-bold bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 select-all">https://modelapi.vn/v1</code>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-500 select-none">3.</span>
                    <div>
                      <span>Dán <strong className="text-cyan-400">OpenAI API Key</strong>: </span>
                      <code className="text-emerald-400 font-bold bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 select-all">{firstSecret || "sk-..."}</code>
                    </div>
                  </div>
                </>
              )}

              {activeEnvTab === "vscode" && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-500 select-none">1.</span>
                    <span>Trong extension <strong className="text-white">Cline / Roo Code</strong>: chọn Provider <strong className="text-blue-400">OpenAI Compatible</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-500 select-none">2.</span>
                    <div>
                      <span>Base URL: </span>
                      <code className="text-emerald-400 font-bold bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 select-all">https://modelapi.vn/v1</code>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-500 select-none">3.</span>
                    <div>
                      <span>API Key: </span>
                      <code className="text-emerald-400 font-bold bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 select-all">{firstSecret || "sk-..."}</code>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-500 select-none">4.</span>
                    <span>Model ID: <code className="text-zinc-300 bg-zinc-950 px-1 rounded">claude-sonnet-5.5</code>, <code className="text-zinc-300 bg-zinc-950 px-1 rounded">gpt-6-astra</code>, hoặc <code className="text-zinc-300 bg-zinc-950 px-1 rounded">gemini-4-argon</code></span>
                  </div>
                </>
              )}

              {activeEnvTab === "cli" && (
                <>
                  <p className="text-zinc-500 text-[11px] mb-1"># Thêm biến môi trường để dùng Claude Code / CLI:</p>
                  <pre className="text-emerald-400 font-bold select-all leading-relaxed">
{`export ANTHROPIC_BASE_URL="https://modelapi.vn/v1"
export ANTHROPIC_API_KEY="${firstSecret || "sk-..."}"
export OPENAI_BASE_URL="https://modelapi.vn/v1"
export OPENAI_API_KEY="${firstSecret || "sk-..."}"`}
                  </pre>
                </>
              )}
            </div>
          </div>

          {/* Quick Developer Dashboard Link Banner */}
          <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/50 -mx-5 -mb-5 px-4 py-3 rounded-b-xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs text-zinc-300">
                Theo dõi số dư quota, token và nhật ký request thời gian thực của Key này
              </span>
            </div>
            <Link
              href={`/developer/usage?key=${encodeURIComponent(firstSecret)}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs shrink-0 active:scale-95"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Kiểm tra Quota & Logs</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Instructions Guide Box */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-xl">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-zinc-400" />
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
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono font-bold text-[10px] mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed pt-0.5">
                    {text}
                  </div>
                </div>

                {image && (
                  <div className="ml-7 sm:ml-8 mt-2">
                    <a
                      href={image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition-all hover:border-zinc-600 max-w-xl"
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
                        <div className="px-3 py-2 text-[11px] text-zinc-400 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
                          <span>📸 {caption}</span>
                          <span className="text-[10px] text-blue-400 font-medium group-hover:underline">
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
          <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block font-mono">
              Hình ảnh chụp màn hình minh họa:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {instructions.images.map((img, imgIdx) => (
                <a
                  key={imgIdx}
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition-all hover:border-zinc-600"
                >
                  <img
                    src={img.url}
                    alt={img.title || `Hình minh họa ${imgIdx + 1}`}
                    className="h-44 w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  {img.title && (
                    <div className="p-2 text-[11px] text-zinc-300 bg-zinc-950">
                      {img.title}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {instructions.note && (
          <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300 leading-relaxed">
            ⚠️ <strong>Lưu ý:</strong> {instructions.note}
          </div>
        )}
      </div>

      {/* 24/7 Customer Support Assistance Box */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Bảo hành 1-đổi-1 & Hỗ trợ kỹ thuật 24/7</span>
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Đội ngũ kỹ thuật viên DaiTruong Store sẵn sàng hỗ trợ bạn qua Zalo & Telegram.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://zalo.me/0987654321"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-xs active:scale-[0.98]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Zalo Hỗ Trợ</span>
            </a>

            <a
              href="https://t.me/daitruong_store"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-xs active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Telegram</span>
            </a>

            <a
              href="tel:0987654321"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-all active:scale-[0.98]"
            >
              <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
              <span>Hotline</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
