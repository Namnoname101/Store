import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingSupport from "@/components/FloatingSupport";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daitruong Store - Hệ Thống cung cấp tài khoản giá rẻ.Uy tín, thanh toán nhanh gọn 24/7.",
  description:
    "Cung cấp tài khoản AI, API AI, dịch vụ mạng xã hội . . . . Thanh toán tự động nhanh chóng Uy Tín 24/7.",
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
