import { Metadata } from "next";
import AdminCodexClient from "@/components/admin/AdminCodexClient";

export const metadata: Metadata = {
  title: "Quản Trị ModelAPI & Codex — DigiStore Admin",
  description:
    "Giám sát hạn mức tài khoản nguồn upstream, đối soát sổ cái delta và quản lý API Key khách hàng.",
};

export default function AdminCodexPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <AdminCodexClient />
    </div>
  );
}
