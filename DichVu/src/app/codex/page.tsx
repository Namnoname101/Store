import { Metadata } from "next";
import CodexTopupClient from "@/components/CodexTopupClient";

export const metadata: Metadata = {
  title: "Nạp Tự Động Codex API Credit — DaiTruong Store",
  description:
    "Nạp hạn mức API Credit cho Cursor, Claude Code, OpenAI & AI Agent. Quota tự động cộng vào API Key của bạn qua VietQR 24/7.",
};

export default function CodexPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#070b14] py-8 sm:py-12">
      <CodexTopupClient />
    </div>
  );
}
