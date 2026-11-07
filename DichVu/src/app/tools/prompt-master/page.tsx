import React from "react";
import { Metadata } from "next";
import PromptMasterClient from "@/components/prompt-master/PromptMasterClient";

export const metadata: Metadata = {
  title: "Master Prompt Generator — Tạo Prompt Chuẩn Quốc Tế Cho Cursor & AI | KhoDEE",
  description:
    "Công cụ tạo Master Prompt chuyên nghiệp miễn phí 100%. Nâng cấp câu prompt ngắn thành System Prompt chi tiết cho Cursor, Claude Code, SEO và Marketing.",
  keywords: [
    "Master Prompt",
    "Prompt Generator",
    "Cursor rules",
    "Claude Code prompt",
    "Viết prompt chuẩn",
    "KhoDEE",
  ],
  openGraph: {
    title: "Master Prompt Generator — KhoDEE",
    description: "Biến 1 câu prompt đơn giản thành Master Prompt chuẩn quốc tế trong 3 giây.",
  },
};

export default function PromptMasterPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 sm:py-16">
      <PromptMasterClient />
    </div>
  );
}
