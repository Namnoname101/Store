import { Metadata } from "next";
import CheckUsageClient from "@/components/CheckUsageClient";

export const metadata: Metadata = {
  title: "Kiểm Tra Hạn Mức & Usage API Claude / Cursor — DaiTruong Store",
  description:
    "Tra cứu thời gian thực số dư Credit, hạn mức token hàng ngày, thống kê overage và lịch sử request của API Key Claude 3.5 Sonnet & Cursor AI.",
};

export default function CheckUsagePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 sm:py-12">
      <CheckUsageClient />
    </div>
  );
}
