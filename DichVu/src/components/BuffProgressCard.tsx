"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  RefreshCw,
  CheckCircle2,
  Activity,
  TrendingUp,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Clock,
  Layers,
  Zap,
} from "lucide-react";
import type { BuffProgressResult, BuffStage } from "@/services/buff-progress.service";

export interface BuffProgressCardProps {
  orderCode?: string;
  initialData?: BuffProgressResult;
}

/**
 * Calculates simulated micro-increment ticking between server polling syncs
 * to provide a smooth, responsive, real-time feel to the customer.
 */
export function calculateInterpolatedStep(
  current: number,
  serverDelivered: number,
  total: number,
  remains: number,
  status: string
): number {
  if (status === "COMPLETED") {
    return total;
  }
  if (status === "CANCELLED" || status === "FAILED") {
    return serverDelivered;
  }

  // If local count is behind server truth, catch up smoothly
  if (current < serverDelivered) {
    const jump = Math.max(1, Math.ceil((serverDelivered - current) / 2));
    return Math.min(serverDelivered, current + jump);
  }

  // If running, simulate gentle incremental progress (+1 to +3 based on quantity)
  // strictly capped to avoid overshooting before the next polling sync.
  if (status === "IN_PROGRESS" && remains > 0 && current < total) {
    const tickBonus = Math.max(1, Math.min(5, Math.floor(total / 500)));
    const maxLocalCeiling = Math.min(
      total,
      serverDelivered + Math.max(3, Math.ceil(total * 0.05))
    );
    return Math.min(maxLocalCeiling, current + tickBonus);
  }

  return current;
}

export function getTimelineSteps(
  status: string,
  startCount?: number,
  remains?: number,
  delivered?: number
) {
  const isCompleted = status === "COMPLETED";
  const isRunning = status === "IN_PROGRESS";
  const isInitializing = status === "INITIALIZING" || status === "RECEIVED";

  return [
    {
      id: 1,
      title: "Tiếp nhận đơn",
      desc: "Hệ thống xác thực liên kết mục tiêu",
      status: "done", // Always completed if order exists
    },
    {
      id: 2,
      title: "Quét số lượng gốc",
      desc:
        startCount !== undefined && startCount > 0
          ? `Số gốc ban đầu: ${startCount.toLocaleString("vi-VN")}`
          : "Đang kết nối & quét dữ liệu",
      status: isCompleted || isRunning ? "done" : "active",
    },
    {
      id: 3,
      title: "Đang đẩy tương tác",
      desc:
        delivered !== undefined && delivered > 0
          ? `Đã tăng: +${delivered.toLocaleString("vi-VN")}`
          : "Đang tăng tốc đẩy luồng",
      status: isCompleted ? "done" : isRunning ? "active" : "pending",
    },
    {
      id: 4,
      title: "Hoàn tất đơn hàng",
      desc: isCompleted ? "Đã giao đủ 100% số lượng" : "Kiểm tra & chốt số lượng",
      status: isCompleted ? "done" : "pending",
    },
  ];
}

export default function BuffProgressCard({
  orderCode,
  initialData,
}: BuffProgressCardProps) {
  const [progress, setProgress] = useState<BuffProgressResult | null>(
    initialData || null
  );
  const [simulatedCount, setSimulatedCount] = useState<number>(
    initialData?.deliveredCount || 0
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const fetchProgress = useCallback(
    async (isManual = false) => {
      if (!orderCode) {
        setIsLoading(false);
        return;
      }
      if (isManual) setIsRefreshing(true);
      try {
        const res = await fetch(`/api/orders/${orderCode}/buff-progress`);
        if (res.ok) {
          const data: BuffProgressResult = await res.json();
          if (data.isBuffOrder) {
            setProgress(data);
            setLastSyncedAt(new Date());
            setSecondsAgo(0);

            // Re-sync simulated counter with server delivered count
            setSimulatedCount((prev) => {
              if (data.status === "COMPLETED") return data.totalQuantity || prev;
              return Math.max(prev, data.deliveredCount || 0);
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch buff progress", err);
      } finally {
        setIsLoading(false);
        if (isManual) {
          setTimeout(() => setIsRefreshing(false), 500);
        }
      }
    },
    [orderCode]
  );

  // Initial fetch on mount if no initialData
  useEffect(() => {
    fetchProgress(false);
  }, [fetchProgress]);

  // Polling every 10 seconds while active
  useEffect(() => {
    if (!progress || progress.status === "COMPLETED" || progress.status === "CANCELLED") {
      return;
    }

    const pollInterval = setInterval(() => {
      fetchProgress(false);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [progress, fetchProgress]);

  // Seconds ago timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastSyncedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncedAt]);

  // Micro-increment ticking simulation for live feeling
  useEffect(() => {
    if (!progress || progress.status === "COMPLETED" || progress.status === "CANCELLED") {
      return;
    }

    const tickInterval = setInterval(() => {
      setSimulatedCount((curr) =>
        calculateInterpolatedStep(
          curr,
          progress.deliveredCount || 0,
          progress.totalQuantity || 0,
          progress.remains || 0,
          progress.status || "IN_PROGRESS"
        )
      );
    }, 2000);

    return () => clearInterval(tickInterval);
  }, [progress]);

  const handleCopyLink = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // If order is not a buff order or orderCode missing, do not render this widget
  if (!orderCode || (!isLoading && (!progress || !progress.isBuffOrder))) {
    return null;
  }

  const total = progress?.totalQuantity || 1;
  const currentCount =
    progress?.status === "COMPLETED" ? total : simulatedCount;
  const displayPercent =
    progress?.status === "COMPLETED"
      ? 100
      : Math.min(100, Math.max(0, Math.round((currentCount / total) * 100)));
  const remainsCount = Math.max(0, total - currentCount);
  const isCompleted = progress?.status === "COMPLETED";
  const isRunning = progress?.status === "IN_PROGRESS";
  const timelineSteps = getTimelineSteps(
    progress?.status || "IN_PROGRESS",
    progress?.startCount,
    progress?.remains,
    currentCount
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900 to-indigo-950/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Header section with live indicator */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 shadow-sm shadow-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                HOÀN TẤT 100%
              </span>
            ) : isRunning ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                TRỰC TIẾP (LIVE STREAM)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
                <Clock className="h-3.5 w-3.5 animate-spin" />
                {progress?.statusLabel || "Đang khởi tạo"}
              </span>
            )}

            <span className="text-xs text-slate-400 font-medium">
              {progress?.providerName || "Máy chủ cấp phát DigiStore"}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Tiến Trình Chạy Dịch Vụ</span>
            <Zap className="h-5 w-5 text-amber-400" />
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
            {progress?.serviceName || "Gói dịch vụ tương tác mạng xã hội"}
          </p>
        </div>

        {/* Sync status & Manual refresh button */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right text-[11px] text-slate-400 hidden sm:block">
            <div>Đồng bộ tự động mỗi 10s</div>
            <div className="text-slate-500">
              {secondsAgo === 0 ? "Vừa xong" : `${secondsAgo} giây trước`}
            </div>
          </div>

          <button
            onClick={() => fetchProgress(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            title="Làm mới tiến trình ngay"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-indigo-400 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            <span>{isRefreshing ? "Đang đồng bộ..." : "Làm mới"}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Percentage display */}
      <div className="relative z-10 py-6">
        <div className="flex items-end justify-between mb-2.5">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tiến độ hoàn thành
            </span>
            <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
              <span className="text-emerald-400 font-bold">
                +{currentCount.toLocaleString("vi-VN")}
              </span>
              <span>/</span>
              <span>{total.toLocaleString("vi-VN")} lượt</span>
            </div>
          </div>

          <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-1">
            <span className="text-emerald-400">{displayPercent}%</span>
          </div>
        </div>

        {/* Shimmer Neon Progress Track */}
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5 border border-slate-700/60 shadow-inner">
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-700 ease-out shadow-lg shadow-emerald-500/30"
            style={{ width: `${displayPercent}%` }}
          >
            {/* Shimmer animated sweep */}
            {!isCompleted && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* 4-Stat Metric Cards */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <Activity className="h-3 w-3 text-sky-400" />
            <span>Số gốc quét được</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-white font-mono">
            {progress?.startCount !== undefined
              ? progress.startCount.toLocaleString("vi-VN")
              : "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span>Đã tăng</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
            +{currentCount.toLocaleString("vi-VN")}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>Còn lại</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-amber-300 font-mono">
            {remainsCount.toLocaleString("vi-VN")}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <Layers className="h-3 w-3 text-indigo-400" />
            <span>Tổng yêu cầu</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-white font-mono">
            {total.toLocaleString("vi-VN")}
          </div>
        </div>
      </div>

      {/* 4-Stage Stepper Timeline */}
      <div className="relative z-10 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 sm:p-5 mb-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Tiến trình xử lý trên máy chủ</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2">
          {timelineSteps.map((step, idx) => {
            const isStepDone = step.status === "done";
            const isStepActive = step.status === "active";

            return (
              <div key={step.id} className="relative flex sm:flex-col items-start gap-3 sm:gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isStepDone
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                        : isStepActive
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20 animate-pulse"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isStepDone ? <Check className="h-4 w-4" /> : step.id}
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isStepDone
                        ? "text-white"
                        : isStepActive
                        ? "text-indigo-300"
                        : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 pl-10 sm:pl-0">
                  {step.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Link & Customer reassurance */}
      {progress?.targetLink && (
        <div className="relative z-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Liên kết mục tiêu đang buff
            </span>
            <div className="text-xs text-indigo-300 font-mono truncate max-w-lg">
              {progress.targetLink}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCopyLink(progress.targetLink)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Sao chép</span>
                </>
              )}
            </button>

            <a
              href={progress.targetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              <span>Xem liên kết</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Safety & White-label guarantee banner */}
      <div className="relative z-10 mt-4 text-center">
        <p className="text-[11px] text-slate-400">
          Máy chủ phân bổ tự động phân tán IP an toàn 100% cho tài khoản. Bạn có thể đóng trình duyệt, hệ thống vẫn tiếp tục chạy tự động.
        </p>
      </div>
    </div>
  );
}
