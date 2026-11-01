import type { Metadata } from "next";
import StorefrontShell from "@/components/StorefrontShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/contexts/CartContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "KhoDEE - Kho Tài Khoản & Dịch Vụ Số. Uy tín, thanh toán nhanh gọn 24/7.",
  description:
    "KhoDEE - Cung cấp tài khoản AI, API AI, tài nguyên và dịch vụ MMO tự động uy tín 24/7.",
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
        className="font-sans min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white antialiased flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-150 overflow-x-hidden w-full max-w-full"
      >
        <ThemeProvider>
          <CartProvider>
            <StorefrontShell>{children}</StorefrontShell>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
