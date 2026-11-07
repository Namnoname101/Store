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
    "Hướng dẫn kích hoạt Codex AI tự động 1-Click vào ứng dụng ChatGPT Windows App bằng công cụ DaiTruong-helper hoặc kết nối OpenAI Compatible vào Cursor IDE, VS Code Cline.",
};

export default function CodexApiGuidePage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10 text-foreground">
      {/* Hero Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3.5 py-1 text-xs font-semibold text-muted-foreground">
          <span>Tài liệu kỹ thuật chính thức</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
          Hướng Dẫn Kích Hoạt & Sử Dụng{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 dark:from-emerald-400 dark:via-teal-400 dark:to-blue-400">
            API Codex
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Tài liệu kích hoạt tự động vào <strong>Ứng dụng ChatGPT (Desktop Windows)</strong> qua DaiTruong-helper và cấu hình <strong>Cursor AI</strong>, <strong>VS Code Cline</strong> qua Gateway OpenAI Compatible.
        </p>

        {/* Cross Link to Claude */}
        <div className="pt-1">
          <Link
            href="/huong-dan/api-claude"
            className="min-h-[44px] inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition underline underline-offset-4"
          >
            Đang tìm hướng dẫn API Claude &amp; Claude Code CLI? Bấm vào đây &rarr;
          </Link>
        </div>

        {/* Action Badges & Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 text-xs">
          <a
            href="/downloads/DaiTruong-helper.zip"
            download="DaiTruong-helper.zip"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-full font-bold transition shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>Tải DaiTruong-helper (1-Click)</span>
          </a>

          <Link
            href="/developer/usage"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-card border border-border hover:bg-muted/40 text-foreground px-5 py-2.5 rounded-full font-semibold transition shadow-xs"
          >
            <Activity className="h-4 w-4 text-primary" />
            <span>Kiểm Tra Quota Codex</span>
          </Link>

          <Link
            href="/codex"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-5 py-2.5 rounded-full font-bold transition shadow-xs"
          >
            <span>Nạp Thêm Quota</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Embedded Interactive Codex Guide Hub */}
      <CodexApiGuideHub showKeyInput={true} />

      {/* Frequently Asked Questions (FAQ) Section */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs text-card-foreground">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Câu Hỏi Thường Gặp Khi Dùng Codex API &amp; DaiTruong-helper
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
            <h3 className="font-bold text-foreground text-sm">
              Người mới cần làm gì trước khi mở DaiTruong-helper?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Bạn cần cài đặt <strong>Codex</strong> hoặc <strong>App ChatGPT Desktop</strong> từ trang chính thức của OpenAI trước (Bước 1). Sau đó mở tool <strong>DaiTruong-helper</strong> dán API Key và bấm <strong>&quot;Kích hoạt Codex&quot;</strong>, tool sẽ tự động cấu hình 100% để bạn mở ứng dụng lên dùng ngay mà không cần gõ lệnh hay sửa file.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
            <h3 className="font-bold text-foreground text-sm">
              Codex API hỗ trợ những model nào?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Codex API chuyên dụng tối ưu cho các mô hình AI Frontier mạnh nhất hiện nay:{" "}
              <strong>GPT-6 series (Astra, Sol, Luna)</strong>, <strong>OpenAI o3 &amp; o3-mini</strong>,{" "}
              <strong>o1 &amp; o1-pro</strong>, <strong>GPT-4.5 High-EQ</strong> và{" "}
              <strong>Claude Sonnet 5.5</strong>. Quota được trừ theo đúng lượng token in/out thực tế của model bạn chọn.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
            <h3 className="font-bold text-foreground text-sm">
              Làm sao để nạp thêm quota vào key đang dùng?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Bạn chỉ cần truy cập trang{" "}
              <Link
                href="/codex"
                className="text-foreground underline font-semibold hover:text-primary transition"
              >
                Nạp Tự Động Codex
              </Link>
              , dán mã Key của bạn vào, chọn gói ($5, $10, $20, $50...) và quét mã VietQR. Hệ thống sẽ tự động cộng hạn mức ngay lập tức mà không cần đổi key.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
            <h3 className="font-bold text-foreground text-sm">
              Kiểm tra số dư quota và request logs ở đâu?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Truy cập trang{" "}
              <Link
                href="/developer/usage"
                className="text-foreground underline font-semibold hover:text-primary transition"
              >
                Tra Cứu Quota Codex API
              </Link>
              . Bạn có thể xem số dư khả dụng, hạn mức đã dùng và chi tiết từng lượt gọi API thời gian thực.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
            <h3 className="font-bold text-foreground text-sm">
              Base URL của Codex API là gì?
            </h3>
            <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed font-mono font-bold select-all">
              https://daitruongstore.fly.dev/v1
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Hãy đảm bảo điền chính xác đường dẫn này vào mục Base URL / Endpoint của Cursor IDE hoặc extension VS Code.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
            <h3 className="font-bold text-foreground text-sm">
              Quota trong key có bị hết hạn theo tháng không?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Không!</strong> Hạn mức nạp qua DaiTruong Store được bảo lưu vĩnh viễn đến khi bạn dùng hết token, không bị reset hàng tháng như các gói thuê bao cố định.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
