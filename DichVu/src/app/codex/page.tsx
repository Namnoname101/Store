import { Metadata } from "next";
import CodexTopupClient from "@/components/CodexTopupClient";
import CodexApiGuideHub from "@/components/CodexApiGuideHub";

export const metadata: Metadata = {
  title: "Nạp Tự Động Codex API Credit — DaiTruong Store",
  description:
    "Nạp hạn mức API Credit cho Cursor, Claude Code, OpenAI & AI Agent. Quota tự động cộng vào API Key của bạn qua VietQR 24/7.",
};

export default function CodexPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#070b14] py-8 sm:py-12">
      <CodexTopupClient />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-12 space-y-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hướng Dẫn Kết Nối Codex API (ModelAPI)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cấu hình nhanh vào Cursor IDE, VS Code (Cline / Roo Code) hoặc Terminal với thông số Base URL chuẩn và mã Key của bạn.
          </p>
        </div>
        <CodexApiGuideHub showKeyInput={true} />
      </div>
    </div>
  );
}
