"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Sparkles,
  Users,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  Mail,
  Play,
  Music,
  Send,
  Tv,
} from "lucide-react";
import { playSuccessChime } from "@/lib/sound";

interface YoutubePremiumCelebrationHubProps {
  orderCode?: string;
  customerEmail?: string | null;
  customerNote?: string | null;
  deliveredItems?: Array<{ secretContent?: string }>;
}

export default function YoutubePremiumCelebrationHub({
  orderCode,
  customerEmail,
  customerNote,
  deliveredItems = [],
}: YoutubePremiumCelebrationHubProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Extract account emails from customerNote or secretContent or customerEmail
  let targetEmails: string[] = [];
  if (customerNote) {
    const clean = customerNote.replace(/\[?YOUTUBE_FAMILY_INVITES?\]?/gi, "").trim();
    const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const match = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) targetEmails.push(match[0]);
    }
  }

  if (targetEmails.length === 0 && deliveredItems.length > 0) {
    deliveredItems.forEach((item) => {
      const text = item.secretContent || "";
      const match = text.match(/EMAIL(?:\s*#\d+)?:\s*([^\s|]+)/i) || text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match && !targetEmails.includes(match[1] || match[0])) {
        targetEmails.push(match[1] || match[0]);
      }
    });
  }

  if (targetEmails.length === 0 && customerEmail) {
    targetEmails.push(customerEmail);
  }

  const primaryEmail = targetEmails[0] || "Gmail của quý khách";

  useEffect(() => {
    // 1. Play success chime
    try {
      playSuccessChime();
    } catch {
      // Ignored if sound is blocked by autoplay policy
    }

    // 2. Fire celebratory confetti with YouTube brand colors
    try {
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const colors = ["#ff0000", "#ffffff", "#f87171", "#fbbf24", "#ef4444"];

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.65 },
          colors,
        });
        confetti({
          particleCount: 5,
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
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.55 },
        colors,
      });
    } catch {
      // Canvas unavailable fallback
    }
  }, []);

  const handleCopyEmail = (emailToCopy: string) => {
    navigator.clipboard.writeText(emailToCopy);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Victory Card */}
      <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-b from-red-500/15 via-card to-card p-6 sm:p-10 shadow-2xl backdrop-blur-md">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 blur-sm rounded-full" />

        <div className="text-center max-w-2xl mx-auto space-y-4">
          {/* Badge Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-600 shadow-xl shadow-red-600/30 ring-8 ring-red-500/10">
            <Play className="h-10 w-10 text-white fill-current translate-x-0.5" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 font-mono shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>KÍCH HOẠT THÀNH CÔNG • LỜI MỜI ĐÃ GỬI</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Đã Gửi Lời Mời YouTube Premium! 🎉
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Admin đã gửi lời mời tham gia nhóm gia đình YouTube Premium vào hòm thư Gmail của bạn. Bạn chỉ cần mở Gmail bấm <strong className="text-foreground">&quot;Chấp nhận lời mời&quot;</strong> để bắt đầu trải nghiệm ngay!
          </p>

          {/* Email Highlight Pill */}
          <div className="pt-2 flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Địa chỉ Gmail nhận lời mời:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {targetEmails.map((email, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary/90 border border-border px-4 py-2 font-mono text-xs sm:text-sm font-bold text-foreground shadow-xs"
                >
                  <Mail className="h-4 w-4 text-red-500" />
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(email)}
                    className="ml-1 text-muted-foreground hover:text-foreground p-1 rounded hover:bg-background transition-colors"
                    title="Sao chép email"
                  >
                    {copiedEmail ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            {orderCode && (
              <span className="text-[11px] text-muted-foreground font-mono">
                Mã đơn hàng: #{orderCode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4-Step Interactive Activation Guide */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span>4 Bước Kích Hoạt YouTube Premium Nhanh Chóng</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Thực hiện lần lượt theo các bước dưới đây để bắt đầu xem video không quảng cáo
            </p>
          </div>

          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Mail className="h-4 w-4" />
            <span>Mở Hộp Thư Gmail Ngay</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Check Mail */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/20 p-5 space-y-3 flex flex-col justify-between hover:border-red-500/40 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs font-mono">
                  01
                </span>
                <Mail className="h-5 w-5 text-red-500" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Kiểm Tra Hộp Thư Gmail
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mở hòm thư Gmail của <strong className="text-foreground">{primaryEmail}</strong>. Tìm email gửi từ <strong>Google Families</strong> hoặc <strong>YouTube</strong> với tiêu đề &quot;Lời mời tham gia nhóm gia đình&quot;.
              </p>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 leading-relaxed">
                💡 <em>Mẹo: Nếu không thấy trong Hộp thư đến, bạn hãy kiểm tra mục <strong>Quảng cáo (Promotions)</strong> hoặc <strong>Thư rác (Spam)</strong> nhé!</em>
              </div>
            </div>

            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all"
            >
              <span>Vào hộp thư Gmail</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </div>

          {/* Card 2: Accept Invitation */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-5 space-y-3 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono">
                  02
                </span>
                <Users className="h-5 w-5 text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Chấp Nhận Lời Mời Gia Đình
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mở email lời mời và bấm nút <strong>&quot;Chấp nhận lời mời&quot; (Accept Invitation)</strong>. Google sẽ hiển thị màn hình xác nhận gia nhập nhóm gia đình, bạn bấm tiếp tục để hoàn tất.
              </p>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 leading-relaxed">
                ✓ <em>Sau khi bấm chấp nhận, gói YouTube Premium sẽ được kích hoạt tức thì trên tài khoản của bạn!</em>
              </div>
            </div>

            <a
              href="https://families.google.com/families"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all"
            >
              <span>Kiểm tra nhóm Google Family</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </div>

          {/* Card 3: Enjoy YouTube Premium */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 p-5 space-y-3 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs font-mono">
                  03
                </span>
                <Tv className="h-5 w-5 text-blue-500" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Thưởng Thức YouTube Premium
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mở YouTube trên máy tính, TV hoặc ứng dụng điện thoại. Logo YouTube góc trên bên trái sẽ chuyển thành <strong>Premium</strong>. Tận hưởng xem video hoàn toàn không bị quảng cáo làm phiền và chất lượng cao nhất.
              </p>
            </div>

            <a
              href="https://www.youtube.com/premium"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all"
            >
              <span>Mở trang YouTube Premium</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </div>

          {/* Card 4: YouTube Music */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 p-5 space-y-3 flex flex-col justify-between hover:border-purple-500/40 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs font-mono">
                  04
                </span>
                <Music className="h-5 w-5 text-purple-500" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Nghe Nhạc Tắt Màn Hình (YouTube Music)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tải ứng dụng <strong>YouTube Music</strong> trên iOS/Android hoặc mở trực tiếp trên web. Bạn có thể nghe nhạc bản quyền chất lượng cao, tắt màn hình hoặc chuyển sang ứng dụng khác nhạc vẫn phát liên tục.
              </p>
            </div>

            <a
              href="https://music.youtube.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all"
            >
              <span>Mở YouTube Music</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </div>
        </div>
      </div>

      {/* Trust & Support Footer */}
      <div className="rounded-2xl border border-border bg-secondary/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-foreground">Cam kết bảo hành Full Time 1-Đổi-1</div>
            <div className="text-muted-foreground">
              Hỗ trợ kỹ thuật chu đáo trọn gói trong suốt thời gian sử dụng.
            </div>
          </div>
        </div>

        <a
          href={`https://t.me/daitruongstore?text=${encodeURIComponent(`Chào shop, mình cần hỗ trợ đơn hàng YouTube Premium #${orderCode || ""}`)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-all shrink-0 shadow-xs"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Hỗ trợ Telegram 24/7</span>
        </a>
      </div>
    </div>
  );
}
