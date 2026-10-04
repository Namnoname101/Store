"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, ExternalLink, ShieldCheck, HeartHandshake } from "lucide-react";

export default function FloatingSupport() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Automatically hide on admin routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Dismiss popup on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide initial tooltip after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none print:hidden flex flex-col items-end"
    >
      {/* Expanded Support Card */}
      {isOpen && (
        <div className="mb-3 w-[300px] sm:w-[330px] rounded-2xl bg-slate-900/95 border border-indigo-500/30 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Hỗ Trợ Khách Hàng</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Trực tuyến 24/7</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 my-3 leading-relaxed">
            Bạn cần hỗ trợ bảo hành key, tư vấn tài khoản hoặc xử lý sự cố? Liên hệ ngay với chúng tôi:
          </p>

          <div className="space-y-2">
            {/* Facebook Messenger */}
            <a
              href="https://www.facebook.com/2k2.2k6"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 hover:border-blue-400 text-slate-100 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-600/40">
                  f
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                    Facebook Cá Nhân / Fanpage
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Phản hồi nhanh trong 1-5 phút
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
            </a>

            {/* Direct Messenger */}
            <a
              href="https://m.me/2k2.2k6"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-slate-600 text-slate-200 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                    Chat Trực Tiếp Messenger
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
            </a>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cam kết hoàn tiền & bảo hành 100% nếu có lỗi</span>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="relative flex items-center">
        {/* Tooltip hint if not opened */}
        {!isOpen && showTooltip && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden sm:flex items-center mr-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-md whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-300">
            <span>Cần hỗ trợ? Chat ngay!</span>
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-r border-t border-indigo-500/30 rotate-45" />
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTooltip(false);
          }}
          aria-label="Hỗ trợ trực tuyến"
          className="relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          {/* Subtle Outer Pulse */}
          <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping -z-10 opacity-75" />

          {isOpen ? (
            <X className="w-6 h-6 transition-transform rotate-0" />
          ) : (
            <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>
    </div>
  );
}
