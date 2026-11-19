import type { Metadata } from "next";
import StorefrontShell from "@/components/StorefrontShell";
import AppSidebar from "@/components/AppSidebar";
import MobileBottomDock from "@/components/MobileBottomDock";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/contexts/CartContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "KhoDEE V2 - Chợ Tài Nguyên Số & Key Bản Quyền Tự Động 24/7",
  description:
    "KhoDEE V2 - Hệ thống cung cấp API AI (Claude, Codex, OpenAI), Tài Khoản Bản Quyền & Nguyên Liệu Số tự động uy tín 24/7 qua VietQR.",
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
        className="font-sans min-h-screen bg-background text-foreground antialiased flex flex-col selection:bg-primary selection:text-primary-foreground transition-colors duration-150 overflow-x-hidden w-full max-w-full"
      >
        <ThemeProvider>
          <CartProvider>
            <SidebarProvider>
              <AppSidebar />
              <StorefrontShell>{children}</StorefrontShell>
              <MobileBottomDock />
            </SidebarProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
