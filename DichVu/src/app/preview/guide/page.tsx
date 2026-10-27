"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Key,
  User,
  ExternalLink,
  Edit3,
  Eye,
  CheckCircle2,
  Copy,
  Terminal,
  Code2,
  FileText,
} from "lucide-react";
import SecretDisplay from "@/components/SecretDisplay";
import OrderSuccessCelebration from "@/components/OrderSuccessCelebration";

type PresetType =
  | "CODEX_API"
  | "TELEGRAM"
  | "CAPCUT"
  | "CLAUDE_API"
  | "LICENSE_KEY"
  | "ACCOUNT"
  | "COURSE_LINK";

export default function GuidePreviewPage() {
  const [activePreset, setActivePreset] = useState<PresetType>("CODEX_API");

  // Sample presets data
  const presets: Record<
    PresetType,
    {
      name: string;
      desc: string;
      orderCode: string;
      productTitle: string;
      productSlug: string;
      productType: string;
      secretContent: string;
    }
  > = {
    CODEX_API: {
      name: "Codex / ModelAPI Key",
      desc: "API Key tốc độ cao cho Cursor & AI Agent",
      orderCode: "DEMO-CODEX",
      productTitle: "Gói Codex 10$ Credit (5.000.000 Quota Points)",
      productSlug: "codex-credit-10usd",
      productType: "LICENSE_KEY",
      secretContent: "sk-modelapi-demo7455abcd1234efgh5678ijkl9012",
    },
    TELEGRAM: {
      name: "Gói Dịch Vụ Telegram",
      desc: "Link mời / Bot token / Tài khoản Tdata",
      orderCode: "DEMO-TELEGRAM",
      productTitle: "Tài khoản Telegram Cũ Hoạt Động (Session / Tdata)",
      productSlug: "telegram-premium",
      productType: "ACCOUNT",
      secretContent: "https://t.me/+InviteLinkTeleVip888 | session_token_xyz999",
    },
    CAPCUT: {
      name: "Tài Khoản CapCut Pro",
      desc: "Tài khoản Pro 30 ngày Full Date, bảo hành trọn đời gói",
      orderCode: "DEMO-CAPCUT",
      productTitle: "Tài khoản CapCut Pro 30 Ngày Full Date",
      productSlug: "capcut-pro-30-ngay",
      productType: "ACCOUNT",
      secretContent: "capcut.vip.member@hotmail.com | 1234567",
    },
    CLAUDE_API: {
      name: "Claude API / Claude Code",
      desc: "Mã API chính hãng kết nối Claude 3.5 Sonnet",
      orderCode: "DEMO-CLAUDE",
      productTitle: "Claude 3.5 Sonnet API Token Không Giới Hạn",
      productSlug: "claude-api",
      productType: "LICENSE_KEY",
      secretContent: "sk-ant-api03-demo9999999999999999999999999999",
    },
    LICENSE_KEY: {
      name: "Key Bản Quyền Windows",
      desc: "Mã kích hoạt phần mềm Windows 11 Pro",
      orderCode: "DEMO-WIN11",
      productTitle: "Windows 11 Pro Retail Bản Quyền Vĩnh Viễn",
      productSlug: "windows-11-pro",
      productType: "LICENSE_KEY",
      secretContent: "VK7JG-NPHTM-C97JM-9MPGT-3V66T",
    },
    ACCOUNT: {
      name: "Tài Khoản ChatGPT Plus",
      desc: "Tài khoản đăng nhập dạng email | mật khẩu",
      orderCode: "DEMO-CHATGPT",
      productTitle: "Tài khoản ChatGPT Plus 1 Tháng Riêng Tư",
      productSlug: "chatgpt-plus",
      productType: "ACCOUNT",
      secretContent: "user.daitruong2026@gmail.com | MatKhauBaoMat@888",
    },
    COURSE_LINK: {
      name: "Link Khóa Học / Dịch Vụ",
      desc: "Liên kết truy cập hoặc kích hoạt tự động",
      orderCode: "DEMO-COURSE",
      productTitle: "Khóa học Fullstack Next.js & AI Agent Masterclass",
      productSlug: "khoa-hoc-nextjs",
      productType: "COURSE_LINK",
      secretContent: "https://daitruong-store.vn/access-course/token_xyz888",
    },
  };

  const current = presets[activePreset];

  const mockDeliveredItems = [
    {
      id: "item-preview-1",
      secretContent: current.secretContent,
      productId: "prod-preview",
      product: {
        id: "prod-preview",
        title: current.productTitle,
        slug: current.productSlug,
        type: current.productType,
      },
    },
  ];

  const mockOrderItems = [
    {
      id: "ord-item-1",
      quantity: 1,
      price: 12000,
      productId: "prod-preview",
      product: {
        id: "prod-preview",
        title: current.productTitle,
        slug: current.productSlug,
        type: current.productType,
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-300">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>Giao Diện Mẫu SecretDisplay (Xem Trước Thời Gian Thực)</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
              Xem & Chỉnh Sửa Hướng Dẫn Sử Dụng
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Trang này hiển thị đúng 100% giao diện thực tế mà khách hàng nhìn thấy sau khi mua hàng.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/order-success/DEMO-CODEX"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Mở trang đơn thật (#DEMO-CODEX)</span>
            </Link>
          </div>
        </div>

        {/* Preset Switcher Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Chọn loại sản phẩm mẫu để xem:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(presets) as PresetType[]).map((key) => {
              const item = presets[key];
              const isSelected = activePreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivePreset(key)}
                  className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-950/40 text-blue-200 shadow-md shadow-blue-500/10"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{item.name}</span>
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 line-clamp-1">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live SecretDisplay Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Giao diện khách hàng nhìn thấy
              </span>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
              Đơn hàng: #{current.orderCode}
            </span>
          </div>

          {/* Compact Order Success Celebration Banner */}
          <OrderSuccessCelebration
            orderCode={current.orderCode}
            totalAmount={50000}
            paidAtFormatted="Vừa xong"
            itemCount={1}
          />

          <SecretDisplay
            orderCode={current.orderCode}
            upstreamStatus="COMPLETED"
            deliveredItems={mockDeliveredItems as any}
            orderItems={mockOrderItems as any}
          />
        </div>

        {/* How to edit guide hint */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
            <FileText className="h-4 w-4" />
            <span>Nơi chỉnh sửa câu chữ & chèn hình ảnh:</span>
          </div>
          <p className="text-xs text-slate-300">
            Toàn bộ hướng dẫn của từng loại gói (Telegram, Codex, Claude API, Windows...) được quản lý tập trung tại:
          </p>
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 font-mono text-xs text-emerald-400 flex items-center justify-between">
            <span>src/lib/product-guides.ts</span>
            <span className="text-slate-500 text-[11px]">Hot-reload tức thì</span>
          </div>
          <div className="text-xs text-slate-400 space-y-2">
            <p>
              💡 <strong>Cách viết chữ bình thường:</strong> gõ dạng chuỗi chữ như cũ <code className="text-indigo-300 font-mono">&quot;Bước 1: Làm gì đó...&quot;</code>.
            </p>
            <p>
              🖼️ <strong>Cách chèn hình ảnh minh họa cho bước:</strong> bạn chỉ cần truyền object có chứa <code className="text-emerald-400 font-mono">image</code> như sau:
            </p>
            <pre className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`{
  text: "Dán mã và cấu hình trong cài đặt...",
  image: "https://link-anh-cua-ban.png", // Hoặc ảnh tải vào thư mục /public/
  caption: "Ảnh minh họa màn hình cài đặt",
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
