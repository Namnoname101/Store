import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daitruong Store - Hệ Thống Dịch Vụ Số & Bản Quyền Tự Động 24/7",
  description:
    "Cung cấp key bản quyền phần mềm, tài khoản AI, Cloud, dịch vụ mạng xã hội và giải trí số. Thanh toán VietQR NAPAS 24/7 nhận hàng tức thì.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="font-sans min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 antialiased flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-150 overflow-x-hidden w-full max-w-full"
      >
        <ThemeProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
            <FloatingSupport />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
