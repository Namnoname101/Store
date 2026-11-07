import { Metadata } from "next";
import UsageDashboardClient from "@/components/developer/UsageDashboardClient";

export const metadata: Metadata = {
  title: "Developer API Usage & Logs — KhoDEE",
  description:
    "Bảng điều khiển hạn mức API, thống kê quota, token usage và nhật ký request thời gian thực.",
};

export default function DeveloperUsagePage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-8 sm:py-12">
      <UsageDashboardClient />
    </div>
  );
}
