"use client";

import { useEffect, useState, useRef } from "react";
import { Clock, AlertTriangle, AlertCircle } from "lucide-react";

/**
 * Formats given seconds into MM:SS string (e.g. 900 -> "15:00", 65 -> "01:05").
 * For 0 or negative numbers, returns "00:00".
 */
export function formatRemainingTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) {
    return "00:00";
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const mm = mins.toString().padStart(2, "0");
  const ss = secs.toString().padStart(2, "0");

  return `${mm}:${ss}`;
}

/**
 * Calculates remaining seconds between now and expiresAt.
 * Clamped to minimum 0.
 */
export function calculateRemainingSeconds(
  expiresAt: Date | string | number
): number {
  const targetTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = Math.floor((targetTime - now) / 1000);
  return Math.max(0, diff);
}

export interface CountdownTimerProps {
  expiresAt: Date | string;
  onExpire?: () => void;
  className?: string;
}

export default function CountdownTimer({
  expiresAt,
  onExpire,
  className = "",
}: CountdownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    calculateRemainingSeconds(expiresAt)
  );
  const onExpireCalled = useRef(false);

  useEffect(() => {
    // Initial check
    const initialRemaining = calculateRemainingSeconds(expiresAt);
    setRemainingSeconds(initialRemaining);

    if (initialRemaining <= 0) {
      if (!onExpireCalled.current) {
        onExpireCalled.current = true;
        onExpire?.();
      }
      return;
    }

    const intervalId = setInterval(() => {
      const remaining = calculateRemainingSeconds(expiresAt);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(intervalId);
        if (!onExpireCalled.current) {
          onExpireCalled.current = true;
          onExpire?.();
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [expiresAt, onExpire]);

  const isExpired = remainingSeconds <= 0;
  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 180; // Less than 3 mins

  if (isExpired) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 ${className}`}
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Đơn hàng đã hết hạn thanh toán</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
        isUrgent
          ? "border-amber-500/40 bg-amber-500/10 text-amber-300 animate-pulse"
          : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
      } ${className}`}
    >
      {isUrgent ? (
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
      ) : (
        <Clock className="h-4 w-4 shrink-0 text-indigo-400" />
      )}
      <span>Hết hạn trong:</span>
      <span className="font-mono text-sm font-bold tracking-wider">
        {formatRemainingTime(remainingSeconds)}
      </span>
    </div>
  );
}
