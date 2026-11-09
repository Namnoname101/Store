"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  UserPlus,
  X,
  Sparkles,
  KeyRound,
  Zap,
} from "lucide-react";

export interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl?: string;
  title?: string;
  description?: string;
}

export default function AuthRequiredModal({
  isOpen,
  onClose,
  callbackUrl,
  title = "Đăng nhập để tiếp tục mua hàng",
  description = "Để đơn hàng và key bản quyền được lưu trữ vĩnh viễn vào tài khoản của bạn kèm chính sách bảo hành 1 đổi 1, vui lòng đăng nhập hoặc tạo tài khoản mới.",
}: AuthRequiredModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPath =
    callbackUrl ||
    (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
  const registerUrl = `/register?callbackUrl=${encodeURIComponent(currentPath)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Click outside backdrop to close */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xl text-card-foreground z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Subtle decorative glow */}
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Đóng hộp thoại"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" /> Yêu cầu tài khoản
            </span>
            <h3
              id="auth-modal-title"
              className="text-base sm:text-lg font-bold text-foreground mt-0.5"
            >
              {title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5">
          {description}
        </p>

        {/* Benefits list */}
        <div className="rounded-xl border border-border/80 bg-secondary/40 p-3.5 space-y-2.5 mb-6 text-xs text-foreground">
          <div className="flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-foreground">Lưu trữ đơn hàng & key vĩnh viễn:</strong>{" "}
              <span className="text-muted-foreground">
                Xem lại tài khoản, key bản quyền và thông tin đăng nhập bất cứ lúc nào trong trang cá nhân.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-foreground">Bảo hành 1 đổi 1 tự động:</strong>{" "}
              <span className="text-muted-foreground">
                Hỗ trợ kỹ thuật, kích hoạt lại và bảo hành nhanh chóng theo ID tài khoản.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Link
            href={loginUrl}
            className="w-full min-h-[46px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Lock className="w-4 h-4" />
            <span>Đăng nhập ngay</span>
          </Link>

          <Link
            href={registerUrl}
            className="w-full min-h-[46px] rounded-xl border border-border bg-card hover:bg-secondary text-foreground font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-primary" />
            <span>Tạo tài khoản mới (Chỉ 10s)</span>
          </Link>
        </div>

        {/* Footer small note */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
          >
            Để sau, tôi muốn tiếp tục xem sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
}
