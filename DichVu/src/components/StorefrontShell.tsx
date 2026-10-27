"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import FloatingSupport from "@/components/FloatingSupport";
import LiveOrderTicker from "@/components/LiveOrderTicker";

export default function StorefrontShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main className="min-h-screen flex flex-col">{children}</main>;
  }

  return (
    <>
      <LiveOrderTicker />
      <Navbar />
      <main className="flex-1 relative">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] glow-mesh pointer-events-none -z-10" />
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <FloatingSupport />
    </>
  );
}
