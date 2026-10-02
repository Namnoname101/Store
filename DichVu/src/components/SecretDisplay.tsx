"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  KeyRound,
  UserCheck,
  GraduationCap,
  ExternalLink,
  ShieldCheck,
  MessageCircle,
  PhoneCall,
  Send,
  HelpCircle,
  Layers,
} from "lucide-react";
import type { Product } from "@prisma/client";

export interface InstructionGuide {
  title: string;
  steps: string[];
  note?: string;
}

export function getProductInstructions(type: string): InstructionGuide {
  switch (type) {
    case "LICENSE_KEY":
      return {
        title: "Hướng dẫn kích hoạt Key Bản Quyền",
        steps: [
          "Mở ứng dụng hoặc phần Cài đặt (Settings > System > Activation trên Windows / Office).",
          "Chọn 'Change product key' hoặc 'Nhập khóa sản phẩm'.",
          "Dán mã kích hoạt đã sao chép ở trên vào ô và chọn 'Next' > 'Activate Online'.",
          "Khởi động lại máy hoặc ứng dụng nếu có thông báo hoàn tất kích hoạt.",
        ],
        note: "Key bản quyền chỉ dùng kích hoạt cho đúng số lượng thiết bị đăng ký. Không chia sẻ mã công khai.",
      };
    case "ACCOUNT":
      return {
        title: "Hướng dẫn đăng nhập & sử dụng Tài khoản",
        steps: [
          "Truy cập vào trang chủ hoặc ứng dụng chính thức của dịch vụ.",
          "Nhập chính xác Email/Tên đăng nhập và Mật khẩu được cấp ở phía trên.",
          "Nếu có hồ sơ (Profile), vui lòng chọn đúng Profile được phân bổ theo tên hoặc số thứ tự.",
          "Tận hưởng dịch vụ đã được kích hoạt gói bản quyền sẵn.",
        ],
        note: "Vui lòng tuyệt đối không tự ý đổi mật khẩu, email khôi phục hoặc phương thức thanh toán để tránh bị khóa tài khoản và mất quyền bảo hành.",
      };
    case "COURSE_LINK":
      return {
        title: "Hướng dẫn truy cập Khóa học & Tài liệu số",
        steps: [
          "Bấm vào liên kết khóa học hoặc sao chép và dán vào trình duyệt web.",
          "Đăng nhập tài khoản bằng email bạn đã dùng để đặt mua đơn hàng này.",
          "Hệ thống khóa học sẽ tự động cấp quyền truy cập vào nội dung video và tài liệu.",
          "Tải tài nguyên bổ trợ đính kèm để bắt đầu học tập.",
        ],
        note: "Liên kết khóa học dành riêng cho bạn, vui lòng không chia sẻ ra bên ngoài để tránh hệ thống tự động khóa truy cập.",
      };
    default:
      return {
        title: "Hướng dẫn sử dụng & nhận sản phẩm",
        steps: [
          "Sao chép thông tin mã sản phẩm hoặc tài khoản được cấp ở phía trên.",
          "Làm theo hướng dẫn kèm theo sản phẩm để kích hoạt hoặc đăng nhập.",
          "Liên hệ đội ngũ hỗ trợ nếu gặp khó khăn trong quá trình sử dụng.",
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
  deliveredItems,
  orderItems,
}: SecretDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Map product info by productId
  const productMap = new Map(orderItems.map((item) => [item.productId, item.product]));

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
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

  if (!deliveredItems || deliveredItems.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
        <p className="text-sm text-slate-400">
          Chưa có thông tin sản phẩm bàn giao cho đơn hàng này.
        </p>
      </div>
    );
  }

  // Determine dominant product type for instruction box
  const primaryProduct = productMap.get(deliveredItems[0].productId);
  const primaryType = primaryProduct?.type || "LICENSE_KEY";
  const instructions = getProductInstructions(primaryType);

  return (
    <div className="space-y-6">
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
