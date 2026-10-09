"use client";

import { useState, useEffect } from "react";
import {
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
  Sparkles,
} from "lucide-react";
import type { Product } from "@prisma/client";
import { playSuccessChime } from "@/lib/sound";
import { saveRecentOrder } from "@/lib/order-storage";
import BuffProgressCard from "@/components/BuffProgressCard";

export interface InstructionGuide {
  title: string;
  steps: string[];
  note?: string;
}

export function getProductInstructions(type: string): InstructionGuide {
  switch (type) {
    case "LICENSE_KEY":
      return {
        title: "Hướng dẫn kích hoạt Key bản quyền",
        steps: [
          "Mở ứng dụng hoặc phần Cài đặt (Settings > System > Activation trên Windows / Office).",
          "Chọn 'Nhập khóa sản phẩm' (Change product key).",
          "Dán mã kích hoạt được cung cấp ở trên để hoàn tất.",
        ],
        note: "Mã bản quyền chỉ sử dụng cho số lượng thiết bị theo gói đã mua.",
      };
    case "ACCOUNT":
      return {
        title: "Hướng dẫn đăng nhập Tài khoản",
        steps: [
          "Truy cập ứng dụng hoặc trang chủ của dịch vụ.",
          "Đăng nhập bằng tài khoản và mật khẩu được cung cấp ở trên.",
          "Nếu có chỉ định Profile, vui lòng chọn đúng Profile được bàn giao.",
        ],
        note: "Không tự ý thay đổi thông tin tài khoản để đảm bảo quyền lợi bảo hành.",
      };
    case "COURSE_LINK":
      return {
        title: "Thông tin liên kết dịch vụ & Khóa học",
        steps: [
          "Bấm vào liên kết được cấp ở trên hoặc dán vào trình duyệt web.",
          "Hệ thống sẽ tự động kích hoạt dịch vụ hoặc điều hướng đến tài nguyên của bạn.",
        ],
        note: "Nếu gặp sự cố về liên kết, vui lòng liên hệ đội ngũ hỗ trợ.",
      };
    default:
      return {
        title: "Hướng dẫn sử dụng",
        steps: [
          "Sao chép thông tin sản phẩm được cấp ở trên.",
          "Làm theo hướng dẫn kích hoạt hoặc đăng nhập.",
          "Liên hệ hỗ trợ nếu cần trợ giúp thêm.",
        ],
      };
  }
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
      return {
        isAccount: true,
        username: parts[0].trim(),
        password: parts.slice(1).join("|").trim(),
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

  const handleCopyAll = async () => {
    const allSecrets = deliveredItems
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
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 p-8 sm:p-10 shadow-2xl text-center">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-xl shadow-indigo-950/50">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Hệ thống cấp phát mã tự động</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-3">
              Đang Tự Động Cấp Phát Sản Phẩm
            </h3>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed mb-6 font-medium">
              Hệ thống đang cấp phát mã tự động cho đơn hàng của bạn. Trang sẽ tự động tải lại sau vài giây.
            </p>

            <div className="w-full max-w-md mx-auto mb-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 animate-pulse" />
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Quá trình khởi tạo thường mất từ 5-15 giây. Vui lòng giữ nguyên cửa sổ trình duyệt.
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
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 text-xs font-bold text-amber-400 mb-2">
                <span>Thông báo cấp phát</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Cấp phát mã đang bị gián đoạn
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Máy chủ cấp phát mã đang bị quá tải hoặc tạm thời gián đoạn. Chúng tôi cam kết xử lý hoàn tiền tự động hoặc gửi mã qua email cho bạn trong vòng 5-15 phút.
              </p>
            </div>
          </div>
        </div>

        {/* Existing refund request or self-service form */}
        {currentRefundInfo || refundSuccessMsg ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-6 sm:p-8 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Đã Ghi Nhận Yêu Cầu Hoàn Tiền
                </h4>
                <p className="text-xs text-emerald-400">
                  {refundSuccessMsg ||
                    "Yêu cầu hoàn tiền của bạn đã được ghi nhận. Nhân viên CSKH sẽ chuyển khoản lại theo thông tin đã cung cấp."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-white">
                  {currentRefundInfo?.bankName || refundBank}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Số tài khoản:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {currentRefundInfo?.accountNumber || refundAccountNo}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-bold text-white">
                  {currentRefundInfo?.accountName || refundAccountName}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400 leading-relaxed">
              Đội ngũ kỹ thuật và CSKH sẽ kiểm tra đối soát và hoàn tiền vào tài khoản trên trong vòng <strong>5-15 phút</strong>. Cảm ơn sự kiên nhẫn của bạn!
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <div className="mb-6">
              <h4 className="text-base sm:text-lg font-bold text-white mb-1">
                Yêu Cầu Hoàn Tiền Tự Động (100% Số Tiền)
              </h4>
              <p className="text-xs text-slate-400">
                Vui lòng cung cấp số tài khoản ngân hàng để hệ thống xử lý hoàn tiền lại cho bạn:
              </p>
            </div>

            {refundError && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{refundError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên ngân hàng thụ hưởng <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={refundBank}
                  onChange={(e) => setRefundBank(e.target.value)}
                  placeholder="Ví dụ: MBBank, Vietcombank, Techcombank, VPBank..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Số tài khoản ngân hàng <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={refundAccountNo}
                    onChange={(e) => setRefundAccountNo(e.target.value)}
                    placeholder="Nhập số tài khoản..."
                    className="w-full font-mono rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Họ và tên chủ tài khoản <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={refundAccountName}
                    onChange={(e) => setRefundAccountName(e.target.value)}
                    placeholder="Ví dụ: NGUYEN VAN A"
                    className="w-full uppercase rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ghi chú thêm (tùy chọn)
                </label>
                <input
                  type="text"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="Ghi chú thêm nếu có..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 px-6 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.01] disabled:opacity-50"
                >
                  {isSubmittingRefund ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Đang gửi thông tin yêu cầu...</span>
                    </>
                  ) : (
                    <span>Gửi yêu cầu hoàn tiền ngay</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Support Channels */}
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 p-5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Cần hỗ trợ trực tiếp từ kỹ thuật viên?</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Đội ngũ kỹ thuật viên trực sẵn sàng hỗ trợ trực tuyến 24/7.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="https://zalo.me/0987654321"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/20 hover:scale-[1.02]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Zalo Hỗ Trợ</span>
              </a>

              <a
                href="https://t.me/digistore_support"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-sky-500/20 hover:scale-[1.02]"
              >
                <Send className="h-4 w-4" />
                <span>Telegram 24/7</span>
              </a>

              <a
                href="tel:0987654321"
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 px-3.5 py-2 text-xs font-bold text-slate-200 transition-all hover:scale-[1.02]"
              >
                <PhoneCall className="h-4 w-4 text-emerald-400" />
                <span>0987.654.321</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback if no delivered items yet
  if (!deliveredItems || deliveredItems.length === 0) {
    return (
      <div className="space-y-6">
        <BuffProgressCard orderCode={orderCode} />
        {!isBuffService && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
            <p className="text-sm text-slate-400">
              Chưa có thông tin sản phẩm bàn giao cho đơn hàng này.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Determine dominant product type for instruction box
  const primaryProduct = productMap.get(deliveredItems[0].productId);
  const primaryType = primaryProduct?.type || "LICENSE_KEY";
  const instructions = getProductInstructions(primaryType);

  return (
    <div className="space-y-6">
      <BuffProgressCard orderCode={orderCode} />
      {/* Top action bar: count & Copy All button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Sản phẩm đã cấp phát thành công
            </h3>
            <p className="text-xs text-slate-400">
              Tổng cộng <strong>{deliveredItems.length}</strong> sản phẩm kỹ thuật số sẵn sàng sử dụng
            </p>
          </div>
        </div>

        {deliveredItems.length > 1 && (
          <button
            type="button"
            onClick={handleCopyAll}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md ${
              copiedAll
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
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
                <span>Sao chép tất cả ({deliveredItems.length})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Delivered items list */}
      <div className="space-y-4">
        {deliveredItems.map((item, index) => {
          const product = productMap.get(item.productId);
          const secretContent = item.secretContent || "";
          const parsed = parseSecretItem(secretContent, product?.type);
          const isCopied = copiedId === item.id;
          const isUsernameCopied = copiedId === `${item.id}-user`;
          const isPasswordCopied = copiedId === `${item.id}-pass`;

          return (
            <div
              key={item.id || index}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg transition-all hover:border-slate-700"
            >
              {/* Item header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {product?.title || "Sản phẩm kỹ thuật số"}
                  </span>
                </div>

                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                  Đã bàn giao
                </span>
              </div>

              {/* Secret display content based on format */}
              {parsed.isAccount && parsed.username && parsed.password ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Username Box */}
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5">
                      <div className="min-w-0">
                        <span className="block text-[10px] uppercase font-semibold text-slate-500">
                          Tài khoản / Email
                        </span>
                        <span className="block font-mono text-sm font-semibold text-white truncate">
                          {parsed.username}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(`${item.id}-user`, parsed.username!)}
                        className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all ${
                          isUsernameCopied
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        }`}
                        title="Sao chép tài khoản"
                      >
                        {isUsernameCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
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

                    {/* Password Box */}
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5">
                      <div className="min-w-0">
                        <span className="block text-[10px] uppercase font-semibold text-slate-500">
                          Mật khẩu
                        </span>
                        <span className="block font-mono text-sm font-semibold text-white truncate">
                          {parsed.password}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(`${item.id}-pass`, parsed.password!)}
                        className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all ${
                          isPasswordCopied
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                        }`}
                        title="Sao chép mật khẩu"
                      >
                        {isPasswordCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
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

                  {/* Combined Copy */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, secretContent)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        isCopied ? "text-emerald-400" : "text-indigo-400 hover:text-indigo-300"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Đã sao chép toàn bộ thông tin đăng nhập!</span>
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">
                      Đường dẫn truy cập khóa học
                    </span>
                    <a
                      href={secretContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs sm:text-sm text-indigo-400 hover:underline truncate block"
                    >
                      {secretContent}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={secretContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Mở link</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, secretContent)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                        isCopied
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-200 hover:bg-slate-750"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Đã sao chép</span>
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
                /* Standard License Key box */
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase font-semibold text-slate-500 mb-0.5">
                      Mã kích hoạt bản quyền
                    </span>
                    <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 tracking-wider break-all select-all">
                      {secretContent}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, secretContent)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md shrink-0 ${
                      isCopied
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 hover:scale-[1.02]"
                    }`}
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
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions Guide Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-indigo-400" />
          <span>{instructions.title}</span>
        </h4>

        <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
          {instructions.steps.map((step, idx) => (
            <li key={idx} className="pl-1">
              <span className="text-slate-200">{step}</span>
            </li>
          ))}
        </ol>

        {instructions.note && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
            ⚠️ <strong>Lưu ý:</strong> {instructions.note}
          </div>
        )}
      </div>

      {/* 24/7 Customer Support Assistance Box */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Cần hỗ trợ kích hoạt hoặc bảo hành 1-đổi-1?</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Đội ngũ kỹ thuật viên DigiStore.vn trực sẵn sàng hỗ trợ trực tuyến 24/7.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="https://zalo.me/0987654321"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/20 hover:scale-[1.02]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Zalo Hỗ Trợ</span>
            </a>

            <a
              href="https://t.me/digistore_support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-sky-500/20 hover:scale-[1.02]"
            >
              <Send className="h-4 w-4" />
              <span>Telegram 24/7</span>
            </a>

            <a
              href="tel:0987654321"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 px-3.5 py-2 text-xs font-bold text-slate-200 transition-all hover:scale-[1.02]"
            >
              <PhoneCall className="h-4 w-4 text-emerald-400" />
              <span>0987.654.321</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
