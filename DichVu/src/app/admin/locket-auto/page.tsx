import { Metadata } from "next";
import LocketAutoClient from "@/components/admin/LocketAutoClient";

export const metadata: Metadata = {
  title: "Tự Động Kích Hoạt Locket Gold 24/7 | DigiStore Admin",
  description: "Trang quản trị tiến trình nền tự động duy trì gói Locket GoldPass",
};

export const dynamic = "force-dynamic";

export default function LocketAutoPage() {
  return <LocketAutoClient />;
}
