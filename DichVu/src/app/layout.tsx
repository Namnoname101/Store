import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigiStore.vn - Hệ Thống Bản Quyền Số & Tài Khoản Tự Động 24/7",
  description:
    "Chuyên cung cấp key bản quyền Windows, Office, tài khoản AI ChatGPT, Canva, Netflix và khóa học trực tuyến. Thanh toán VietQR nhận hàng tức thì trong 30 giây.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingSupport />
      </body>
    </html>
  );
}
