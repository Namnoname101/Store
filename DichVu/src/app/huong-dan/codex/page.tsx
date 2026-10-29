import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Terminal,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";
import CodexApiGuideHub from "@/components/CodexApiGuideHub";

export const metadata: Metadata = {
  title: "Hướng Dẫn Cấu Hình Codex AI — DaiTruong Store",
  description:
    "Hướng dẫn kết nối Codex AI (Base URL: https://modelapi.vn/v1) vào Cursor IDE, VS Code Cline / Roo Code và Terminal. Tự động tính quota, hỗ trợ Claude 3.5 Sonnet, GPT-4o.",
};

export default function CodexApiGuidePage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 backdrop-blur-sm">
          <Cpu className="h-4 w-4" />
          <span>Tài Liệu Cấu Hình Codex AI</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Hướng Dẫn Cấu Hình{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500">
            Codex AI
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Sử dụng <strong>Base URL: https://modelapi.vn/v1</strong> với chuẩn OpenAI Compatible.
          Dễ dàng kết nối vào Cursor IDE, Cline, Roo Code, Continue.dev hoặc các AI Agent với chi phí tối ưu theo token thực tế.
        </p>

        {/* Action Badges & Switch Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 text-xs">
          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>OpenAI Compatible V1</span>
          </span>
          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Cursor Composer & Autocomplete</span>
          </span>
          <Link
            href="/codex"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-full font-semibold transition shadow-xs"
          >
            <span>Nạp Thêm Quota</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/huong-dan/api-claude"
            className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-3.5 py-1.5 rounded-full font-semibold transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Xem hướng dẫn API Claude</span>
          </Link>
        </div>
      </div>

      {/* Embedded Interactive Codex Guide Hub */}
      <CodexApiGuideHub showKeyInput={true} />

      {/* Frequently Asked Questions (FAQ) Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <HelpCircle className="h-5 w-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Câu Hỏi Thường Gặp Khi Dùng Codex API
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="text-emerald-500">Q:</span>
              <span>Codex API hỗ trợ những model nào?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Codex API hỗ trợ đầy đủ các model mạnh nhất: <strong>Claude 3.5 Sonnet</strong>, <strong>Claude Opus</strong>, <strong>GPT-4o</strong>, <strong>Gemini 1.5 Pro</strong>. Quota được trừ theo đúng lượng token in/out thực tế của model bạn chọn.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="text-emerald-500">Q:</span>
              <span>Làm sao để nạp thêm quota vào key đang dùng?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Bạn chỉ cần truy cập trang{" "}
              <Link
                href="/codex"
                className="text-emerald-600 dark:text-emerald-400 underline font-semibold hover:text-emerald-700"
              >
                Nạp Tự Động Codex
              </Link>
              , dán mã Key của bạn vào, chọn gói ($5, $10, $20, $50...) và quét mã VietQR. Hệ thống sẽ tự động cộng hạn mức ngay lập tức mà không cần đổi key.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="text-emerald-500">Q:</span>
              <span>Base URL của Codex API là gì?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
              https://modelapi.vn/v1
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Hãy đảm bảo điền chính xác đường dẫn này vào mục Base URL / Endpoint của Cursor hoặc extension VS Code.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="text-emerald-500">Q:</span>
              <span>Quota trong key có bị hết hạn theo tháng không?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>Không!</strong> Hạn mức nạp qua DaiTruong Store được bảo lưu vĩnh viễn đến khi bạn dùng hết token, không bị reset hàng tháng như các gói thuê bao cố định.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
