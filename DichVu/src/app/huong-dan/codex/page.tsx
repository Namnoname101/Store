import type { Metadata } from "next";
import Link from "next/link";
import {
  HelpCircle,
  ArrowRight,
  Download,
  Activity,
} from "lucide-react";
import CodexApiGuideHub from "@/components/CodexApiGuideHub";

export const metadata: Metadata = {
  title: "Hướng Dẫn Kích Hoạt Codex AI Cho Ứng Dụng ChatGPT (Windows) & IDE — DaiTruong Store",
  description:
    "Hướng dẫn kích hoạt Codex AI tự động 1-Click vào ứng dụng ChatGPT Windows App bằng công cụ KhoDee-helper hoặc kết nối Base URL https://modelapi.vn/v1 vào Cursor IDE, VS Code Cline.",
};

export default function CodexApiGuidePage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-3.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>Tài liệu kỹ thuật chính thức</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Hướng Dẫn Kích Hoạt & Sử Dụng{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 dark:from-emerald-400 dark:via-teal-400 dark:to-blue-400">
            API Codex
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Tài liệu kích hoạt tự động vào <strong>Ứng dụng ChatGPT (Desktop Windows)</strong> qua KhoDee-helper và cấu hình <strong>Cursor AI</strong>, <strong>VS Code Cline</strong> qua Gateway OpenAI Compatible.
        </p>

        {/* Cross Link to Claude */}
        <div className="pt-1">
          <Link
            href="/huong-dan/api-claude"
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline underline-offset-4 transition"
          >
            Đang tìm hướng dẫn API Claude &amp; Claude Code CLI? Bấm vào đây &rarr;
          </Link>
        </div>

        {/* Action Badges & Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 text-xs">
          <a
            href="/downloads/KhoDee-helper.zip"
            download="KhoDee-helper.zip"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 text-white px-3.5 py-1.5 rounded-full font-semibold transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Tải KhoDee-helper (1-Click)</span>
          </a>

          <Link
            href="/developer/usage"
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 px-3.5 py-1.5 rounded-full font-medium transition"
          >
            <Activity className="h-3.5 w-3.5 text-blue-500" />
            <span>Kiểm Tra Quota Codex</span>
          </Link>

          <Link
            href="/codex"
            className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-3.5 py-1.5 rounded-full font-semibold transition"
          >
            <span>Nạp Thêm Quota</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Embedded Interactive Codex Guide Hub */}
      <CodexApiGuideHub showKeyInput={true} />

      {/* Frequently Asked Questions (FAQ) Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <HelpCircle className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Câu Hỏi Thường Gặp Khi Dùng Codex API &amp; KhoDee-helper
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              KhoDee-helper dùng cho ứng dụng ChatGPT (Windows) như thế nào?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              KhoDee-helper được tạo ra dành riêng cho <strong>Ứng dụng ChatGPT Desktop trên Windows</strong>. Bạn chỉ cần dán mã API Key Codex và bấm <strong>&quot;Kích hoạt Codex&quot;</strong>, tool sẽ tự động nạp model <strong>gpt-6.1-sol</strong> vào hệ thống. Sau đó bấm nút <strong>&quot;Mở ứng dụng ChatGPT&quot;</strong> trên tool là ứng dụng ChatGPT sẽ mở ra để bạn bắt đầu lập trình và trò chuyện ngay lập tức.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Codex API hỗ trợ những model nào?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Codex API hỗ trợ đầy đủ các model AI mạnh nhất hiện nay: <strong>Claude 3.5 Sonnet</strong>, <strong>Claude Opus</strong>, <strong>GPT-4o</strong>, <strong>Gemini 1.5 Pro</strong>. Quota được trừ theo đúng lượng token in/out thực tế của model bạn chọn.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Làm sao để nạp thêm quota vào key đang dùng?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Bạn chỉ cần truy cập trang{" "}
              <Link
                href="/codex"
                className="text-slate-900 dark:text-white underline font-semibold hover:text-emerald-600"
              >
                Nạp Tự Động Codex
              </Link>
              , dán mã Key của bạn vào, chọn gói ($5, $10, $20, $50...) và quét mã VietQR. Hệ thống sẽ tự động cộng hạn mức ngay lập tức mà không cần đổi key.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Kiểm tra số dư quota và request logs ở đâu?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Truy cập trang{" "}
              <Link
                href="/developer/usage"
                className="text-slate-900 dark:text-white underline font-semibold hover:text-emerald-600"
              >
                Tra Cứu Quota Codex API
              </Link>
              . Bạn có thể xem số dư khả dụng, hạn mức đã dùng và chi tiết từng lượt gọi API thời gian thực.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Base URL của Codex API là gì?
            </h3>
            <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed font-mono font-bold select-all">
              https://modelapi.vn/v1
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Hãy đảm bảo điền chính xác đường dẫn này vào mục Base URL / Endpoint của Cursor IDE hoặc extension VS Code.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Quota trong key có bị hết hạn theo tháng không?
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
