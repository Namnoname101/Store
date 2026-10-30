import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Terminal,
  HelpCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Layers,
  CheckCircle2,
} from "lucide-react";
import ClaudeApiGuideHub from "@/components/ClaudeApiGuideHub";

export const metadata: Metadata = {
  title: "Hướng Dẫn Cấu Hình API Claude & Codex - DaiTruong Store",
  description:
    "Hướng dẫn chi tiết từng bước kết nối API Claude với VS Code Claude Code CLI, Claude Desktop App (Cowork), OpenClaw Agent, Open Design Gateway và Cursor.",
};

export default function ClaudeApiGuidePage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 backdrop-blur-sm">
          <Sparkles className="h-4 w-4" />
          <span>Tài Liệu Hướng Dẫn Toàn Diện Dành Cho Người Mới</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Hướng Dẫn Cấu Hình{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            API Claude & Codex
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Áp dụng cho tất cả các gói <strong>API Claude ($10 - $5000)</strong> và <strong>Codex Credit</strong>. 
          Chỉ cần 1 mã API Key, bạn có thể kết nối ngay lập tức với 5 nền tảng AI mạnh mẽ nhất hiện nay.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 text-[11px] font-medium text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Claude 3.5 Sonnet & Opus 4.7</span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Tự động điền 1-Click</span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Bảo lưu Quota vĩnh viễn</span>
          </span>
        </div>

        {/* Switch to Codex API */}
        <div className="pt-2">
          <Link
            href="/huong-dan/codex"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 transition shadow-xs"
          >
            <span>👉 Bạn đang dùng gói Codex AI? Bấm xem Hướng Dẫn Codex AI tại đây</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Embedded Interactive Guide Hub */}
      <ClaudeApiGuideHub showKeyInput={true} />

      {/* Frequently Asked Questions (FAQ) Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <HelpCircle className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Câu Hỏi Thường Gặp (FAQ) & Xử Lý Sự Cố
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">Q:</span>
              <span>1 API Key có dùng cùng lúc trên nhiều máy được không?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>Có!</strong> API Key hoạt động theo hạn mức quota token. Bạn có thể cấu hình cùng một Key trên cả VS Code ở laptop, Claude Desktop trên PC và OpenClaw chạy nền trên máy chủ cá nhân mà không bị khóa.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">Q:</span>
              <span>Làm sao để kiểm tra số dư và hạn mức request đã dùng?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Bạn có thể truy cập trang{" "}
              <Link
                href="/developer/usage"
                className="text-indigo-600 dark:text-indigo-400 underline font-semibold hover:text-indigo-500"
              >
                Kiểm tra Quota & Request Logs
              </Link>
              , dán mã Key của bạn vào để xem chi tiết số token còn lại, model đã gọi và độ trễ phản hồi thời gian thực.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="text-rose-500 dark:text-rose-400">Q:</span>
              <span>Gặp lỗi 401 Unauthorized hoặc Invalid Key thì làm sao?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Vui lòng kiểm tra lại: (1) Bạn đã copy đúng toàn bộ chuỗi key chưa (bắt đầu bằng <code>sk-...</code>, không thừa dấu cách ở đầu/cuối), (2) Đã cấu hình chính xác Base URL theo tài liệu hướng dẫn chưa.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">Q:</span>
              <span>Chính sách bảo hành và hỗ trợ kỹ thuật như thế nào?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Tất cả các gói API tại DaiTruong Store đều được bảo hành Full thời hạn (BHF). Nếu gặp sự cố đường truyền hoặc gateway, kỹ thuật viên trực tuyến 24/7 qua Telegram để hỗ trợ Ultraview / Teamviewer xử lý ngay lập tức.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Bottom Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-lg">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">
            Chưa sở hữu API Key tốc độ cao?
          </h3>
          <p className="text-xs text-indigo-200/90">
            Xem ngay bảng giá các gói Claude API và Codex Credit với mức giá ưu đãi nhất thị trường.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/#catalog"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            <span>Xem Kho Sản Phẩm API</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
