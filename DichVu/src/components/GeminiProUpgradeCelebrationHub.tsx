"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  HardDrive,
  Sparkles,
  Users,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  KeyRound,
  Lock,
  Send,
  Zap,
} from "lucide-react";
import { playSuccessChime } from "@/lib/sound";

interface GeminiProUpgradeCelebrationHubProps {
  orderCode?: string;
  customerEmail?: string | null;
  customerNote?: string | null;
  deliveredItems?: Array<{ secretContent?: string }>;
  paidAtFormatted?: string;
}

export default function GeminiProUpgradeCelebrationHub({
  orderCode,
  customerEmail,
  customerNote,
  deliveredItems = [],
  paidAtFormatted,
}: GeminiProUpgradeCelebrationHubProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Extract account email from customerNote or secretContent
  let targetEmail = customerEmail || "";
  if (!targetEmail && customerNote) {
    const match = customerNote.match(/GMAIL:\s*([^|\s]+)/i);
    if (match) targetEmail = match[1].trim();
  }
  if (!targetEmail && deliveredItems.length > 0) {
    const raw = deliveredItems[0]?.secretContent || "";
    const match = raw.match(/TÀI KHOẢN:\s*([^|\s]+)/i) || raw.match(/([a-zA-Z0-9._%+-]+@gmail\.com)/i);
    if (match) targetEmail = match[1].trim();
  }

  useEffect(() => {
    // 1. Play success victory sound
    try {
      playSuccessChime();
    } catch {
      // Audio might be muted by browser policy
    }

    // 2. Fire 3-stage celebratory confetti
    try {
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const colors = ["#4285F4", "#9B72CB", "#D96570", "#F2994A", "#10B981", "#EAB308"];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.65 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.65 },
          colors,
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };

      frame();
      // Center burst
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
        colors,
      });
    } catch {
      // Ignore if canvas is unavailable
    }
  }, []);

  const handleCopyEmail = () => {
    if (!targetEmail) return;
    navigator.clipboard.writeText(targetEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* 1. HERO CELEBRATION BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-[#0c1026] via-[#12193b] to-[#080b18] p-6 sm:p-10 text-white shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-purple-500/25 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
          {/* Top Status Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-4 py-1.5 text-xs font-mono font-bold text-emerald-300 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span>HOÀN TẤT NÂNG CẤP • DUNG LƯỢNG 5TB CHÍNH CHỦ</span>
          </div>

          {/* Epic Title */}
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 leading-tight">
            Tài Khoản Đã Kích Hoạt 5TB Thành Công!
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
            Chúc mừng bạn! Quản trị viên đã nâng cấp trọn vẹn gói{" "}
            <strong className="text-white font-bold">Google One 5TB &amp; Gemini Pro 12 Tháng</strong> vào tài khoản của bạn.
          </p>

          {/* Upgraded Account Pill */}
          {targetEmail && (
            <div className="inline-flex items-center gap-2.5 rounded-2xl border border-indigo-400/30 bg-slate-900/80 px-4 py-2 text-xs sm:text-sm font-mono text-indigo-200 shadow-inner backdrop-blur-md">
              <span className="text-slate-400 text-xs">Tài khoản nâng cấp:</span>
              <strong className="text-emerald-400 font-bold">{targetEmail}</strong>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="ml-1 rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Sao chép Gmail"
              >
                {copiedEmail ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] sm:text-xs text-slate-400 font-mono">
            <span>Mã đơn: <b className="text-amber-400 font-bold">#{orderCode}</b></span>
            <span>•</span>
            <span>Thời hạn: <b className="text-indigo-300 font-bold">12 Tháng (365 Ngày)</b></span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
              Gói KBH
            </span>
          </div>
        </div>
      </div>

      {/* 2. BENTO GRID 4 UNLOCKED PRIVILEGES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: 5TB Cloud Storage */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0e1320] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-500">
                5TB Cloud Storage
              </div>
              <div className="text-sm font-extrabold text-foreground">
                5.000 GB Dung Lượng
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dùng chung cho Google Drive, Gmail và Google Photos với tốc độ tải lên tối đa.
          </p>
        </div>

        {/* Card 2: Gemini 4 Argon & 3.8 Flash */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0e1320] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-500">
                Trí Tuệ Nhân Tạo
              </div>
              <div className="text-sm font-extrabold text-foreground">
                Gemini 4 Argon &amp; 3.8
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Mở khóa mô hình AI 2M tokens context, viết code và phân tích chuyên sâu trong Antigravity &amp; AI Studio.
          </p>
        </div>

        {/* Card 3: Family Sharing Manager */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0e1320] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Nhóm Gia Đình
              </div>
              <div className="text-sm font-extrabold text-foreground">
                Mời Thêm 5 Thành Viên
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tài khoản có quyền tạo Family để mời thêm tối đa 5 Gmail (hoặc Gmail chính) vào hưởng chung quyền lợi.
          </p>
        </div>

        {/* Card 4: 12-Month Official Validity */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#0e1320] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
                Thời Hạn Bản Quyền
              </div>
              <div className="text-sm font-extrabold text-foreground">
                12 Tháng (365 Ngày)
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Gói nâng cấp trực tiếp đã sẵn sàng để quý khách kiểm tra và sử dụng ngay.
          </p>
        </div>
      </div>

      {/* 3. QUICK 1-TOUCH VERIFICATION ACTION BUTTONS */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            Bấm vào để kiểm tra nghiệm thu &amp; trải nghiệm ngay:
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Action 1: Check Drive Storage */}
          <a
            href="https://drive.google.com/settings/storage"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <HardDrive className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Kiểm tra 5TB Drive
                </div>
                <div className="text-[11px] text-muted-foreground">drive.google.com/settings/storage</div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-blue-500 shrink-0" />
          </a>

          {/* Action 2: Open Gemini Web */}
          <a
            href="https://gemini.google.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Mở Gemini Pro Web
                </div>
                <div className="text-[11px] text-muted-foreground">gemini.google.com</div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-purple-500 shrink-0" />
          </a>

          {/* Action 3: Family Management */}
          <a
            href="https://myaccount.google.com/family/details"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all group sm:col-span-2 md:col-span-1"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Tạo Nhóm Family (Mời Gmail chính)
                </div>
                <div className="text-[11px] text-muted-foreground">myaccount.google.com/family</div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-emerald-500 shrink-0" />
          </a>
        </div>
      </div>

      {/* 4. MANDATORY SECURITY SAFEGUARD BOX */}
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20 p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <span>KHUYẾN NGHỊ BẢO MẬT &amp; HƯỚNG DẪN DÙNG CHUNG:</span>
            </h4>
            <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
              <p>
                • <strong>Nếu bạn đưa Gmail chính:</strong> Shop đã hoàn tất nâng cấp 100%. Quý khách hãy{" "}
                <strong className="text-foreground">ĐỔI LẠI MẬT KHẨU GMAIL NGAY BÂY GIỜ</strong> để bảo mật tuyệt đối tài khoản cá nhân.
              </p>
              <p>
                • <strong>Nếu bạn đưa Gmail clone (phụ):</strong> Bạn có thể vào mục{" "}
                <a
                  href="https://myaccount.google.com/family/details"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-semibold underline"
                >
                  Google Family
                </a>{" "}
                rồi nhập Gmail chính của bạn vào để dùng chung 5TB và Gemini Pro mà không cần đổi mật khẩu.
              </p>
            </div>

            <div className="pt-2">
              <a
                href="https://myaccount.google.com/signinoptions/password"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2 transition-all shadow-xs"
              >
                <span>Đổi lại mật khẩu Google tại đây</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 5. POLICY NOTE & CSKH SUPPORT */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-border bg-secondary/40 text-xs text-muted-foreground">
        <div>
          <span>Điều khoản: </span>
          <strong className="text-foreground">Gói KBH (Không bảo hành sau khi quý khách đã nghiệm thu thành công)</strong>.
        </div>
        <a
          href={`https://t.me/daitruongstore?text=${encodeURIComponent(`Chào shop, mình cần hỗ trợ đơn nâng cấp 5TB #${orderCode}`)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Hỗ trợ kỹ thuật qua Telegram Shop 24/7</span>
        </a>
      </div>
    </div>
  );
}
