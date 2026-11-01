"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const ref = searchParams?.get("ref") || searchParams?.get("coupon");
      if (ref && typeof ref === "string" && ref.trim()) {
        const cleanCode = ref.trim().toUpperCase();
        localStorage.setItem("khodee_affiliate_ref", cleanCode);
        localStorage.setItem("khodee_auto_coupon", cleanCode);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [searchParams]);

  return null;
}
