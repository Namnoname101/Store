import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, ArrowRight } from "lucide-react";
import ClaudeApiGuideHub from "@/components/ClaudeApiGuideHub";

export const metadata: Metadata = {
  title: "Hướng Dẫn Cấu Hình & Sử Dụng API Claude 5.5 & 5.6 — DaiTruong Store",
  description:
    "Hướng dẫn chi tiết từng bước kết nối API Claude 5.5 & 5.6 với Claude Desktop App (Cowork), Cursor AI, VS Code Claude Code CLI và Open Design Gateway.",
};

export default function ClaudeApiGuidePage() {
  return (
    <div className="min-h-screen py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 text-foreground">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3.5 py-1 text-xs font-semibold text-muted-foreground">
          <span>Tài liệu kỹ thuật chính thức</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Hướng Dẫn Cấu Hình &amp; Sử Dụng{" "}
          <span className="text-[#D97757]">API Claude 5.5 &amp; 5.6</span>
        </h1>

        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Tài liệu kết nối API Key Claude Anthropic tốc độ cao với <strong>Claude Desktop</strong>, <strong>Cursor AI</strong>, <strong>Claude Code CLI</strong> và <strong>Open Design</strong>.
        </p>

        {/* Small subtle switcher for Codex */}
        <div className="pt-1">
          <Link
            href="/huong-dan/codex"
            className="min-h-[44px] inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition underline underline-offset-4"
          >
            Đang tìm hướng dẫn Codex AI &amp; ChatGPT App? Bấm vào đây →
          </Link>
        </div>
      </div>

      {/* Embedded Interactive Guide Hub */}
      <ClaudeApiGuideHub showKeyInput={true} />

      {/* Frequently Asked Questions (FAQ) Section */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs text-card-foreground">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Câu Hỏi Thường Gặp (FAQ)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
            <h3 className="font-bold text-foreground text-sm">
              1 API Key có dùng cùng lúc trên nhiều máy được không?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Có.</strong> API Key trừ điểm quota theo token thực tế sử dụng. Bạn có thể cấu hình cùng một mã Key trên Claude Desktop, Cursor ở máy tính công ty và laptop cá nhân cùng lúc.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
            <h3 className="font-bold text-foreground text-sm">
              Làm sao để kiểm tra số dư và lịch sử request đã dùng?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Truy cập trang{" "}
              <Link
                href="/developer/usage"
                className="text-primary underline font-semibold hover:underline"
              >
                Kiểm tra Quota &amp; Logs
              </Link>
              , dán mã Key để xem chi tiết hạn mức còn lại, model đã gọi và độ trễ phản hồi thời gian thực.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
            <h3 className="font-bold text-foreground text-sm">
              Gặp lỗi 401 Unauthorized hoặc Invalid Key thì làm sao?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Vui lòng kiểm tra lại: (1) Chuỗi key đã copy đủ ký tự chưa (bắt đầu bằng <code>sk-...</code>, không thừa khoảng trắng), (2) Đã điền đúng Base URL <code>https://1gw.gwai.cloud</code> và Auth schema <code>x-api-key</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
            <h3 className="font-bold text-foreground text-sm">
              Chính sách bảo hành và hỗ trợ kỹ thuật như thế nào?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Tất cả các gói API Claude đều được bảo hành full thời hạn sử dụng. Khi cần hỗ trợ cấu hình hoặc giải đáp kỹ thuật, đội ngũ hỗ trợ qua Telegram 24/7 qua Ultraviewer / Teamviewer.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Bottom Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs text-card-foreground">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Bạn cần mua thêm gói API Claude tốc độ cao?
          </h3>
          <p className="text-xs text-muted-foreground">
            Cấp phát mã tự động 24/7 ngay sau khi thanh toán, đa dạng hạn mức từ 10$ đến 5000$.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/#catalog"
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 text-xs font-bold transition shadow-xs active:scale-95"
          >
            <span>Xem Các Gói API</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
