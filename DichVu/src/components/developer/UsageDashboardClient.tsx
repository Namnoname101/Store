"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Terminal,
  Zap,
  Key,
  TrendingUp,
  Clock,
  Layers,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  Copy,
} from "lucide-react";

interface UsageData {
  quota: number;
  usedQuota: number;
  totalGrantedQuota?: number;
  balanceUsd: number;
  usedUsd: number;
  totalGrantedUsd?: number;
  consumptionRate: number;
  maskedKey: string;
  keyName: string;
  status: string;
  isLowCredit: boolean;
  lastSyncedAt?: string;
}

interface RequestLog {
  id: number;
  createdAt: string;
  model_name: string;
  quota: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  costUsd: number;
  latency?: number;
  use_time?: number;
  status?: number;
}

export default function UsageDashboardClient() {
  const [apiKey, setApiKey] = useState<string>("");
  const [inputKey, setInputKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [usage, setUsage] = useState<UsageData | null>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);

  const [modelFilter, setModelFilter] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Initialize key from localStorage or URL parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const paramKey = urlParams.get("apiKey") || urlParams.get("key");
      const storedKey = localStorage.getItem("khodee_dev_api_key") || localStorage.getItem("daitruong_dev_api_key");

      if (paramKey) {
        setApiKey(paramKey);
        setInputKey(paramKey);
        localStorage.setItem("khodee_dev_api_key", paramKey);
      } else if (storedKey) {
        setApiKey(storedKey);
        setInputKey(storedKey);
      }
    }
  }, []);

  // Fetch Usage
  const fetchUsage = useCallback(async (key: string) => {
    if (!key) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/developer/usage", {
        headers: { "x-api-key": key },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Không thể tải thông tin usage cho key này");
        setUsage(null);
      } else {
        setUsage(data);
        localStorage.setItem("khodee_dev_api_key", key);
      }
    } catch (err: any) {
      setError(err.message || "Lỗi mạng khi tải thông tin usage");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Logs
  const fetchLogs = useCallback(async (key: string, currentPage: number) => {
    if (!key) return;

    try {
      const res = await fetch(
        `/api/developer/logs?page=${currentPage}&pageSize=${pageSize}`,
        {
          headers: { "x-api-key": key },
        }
      );
      const data = await res.json();

      if (res.ok && data.success) {
        setLogs(data.logs || []);
        setTotalLogs(data.total || 0);
      }
    } catch {
      // Ignore background log fetch errors
    }
  }, [pageSize]);

  // Trigger data load when apiKey or page changes
  useEffect(() => {
    if (apiKey) {
      fetchUsage(apiKey);
      fetchLogs(apiKey, page);
    }
  }, [apiKey, page, fetchUsage, fetchLogs]);

  const handleApplyKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    setApiKey(inputKey.trim());
    setPage(1);
  };

  const handleCopyKey = () => {
    if (usage?.maskedKey) {
      navigator.clipboard.writeText(usage.maskedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const filteredLogs = logs.filter((log) =>
    modelFilter ? log.model_name.toLowerCase().includes(modelFilter.toLowerCase()) : true
  );

  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-mono font-medium text-foreground shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>KhoDEE Developer Portal</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            API Usage & Real-time Logs
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Theo dõi hạn mức còn lại, tỷ lệ sử dụng và lịch sử request thực tế của API Key.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (apiKey) {
                fetchUsage(apiKey);
                fetchLogs(apiKey, page);
              }
            }}
            disabled={isLoading || !apiKey}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-card-foreground hover:bg-muted/50 transition disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>

          <Link
            href="/codex"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition active:scale-[0.98]"
          >
            <Zap className="h-4 w-4" />
            <span>Nạp Thêm Quota</span>
          </Link>
        </div>
      </div>

      {/* API Key input bar */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
        <form onSubmit={handleApplyKey} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Nhập API Key của bạn (sk-...) để xem thống kê..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-xs sm:text-sm font-mono text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputKey.trim()}
            className="min-h-[44px] rounded-xl bg-primary px-6 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition shrink-0 inline-flex items-center justify-center"
          >
            Tra cứu
          </button>
        </form>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Low credit alert if applicable */}
      {usage?.isLowCredit && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Cảnh báo: Hạn mức khả dụng sắp hết (${usage.balanceUsd.toFixed(2)} còn lại)
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Vui lòng nạp thêm credit để tránh gián đoạn các phiên làm việc của Cursor, Claude Code hoặc AI Agent.
              </p>
            </div>
          </div>
          <Link
            href="/codex"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-xs font-bold text-white shadow transition shrink-0"
          >
            <span>Nạp ngay</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      {usage && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Balance Remaining */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Hạn mức khả dụng
              </span>
              <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <Database className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-foreground">
                ${usage.balanceUsd.toFixed(2)}
              </div>
              <div className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {usage.quota.toLocaleString("vi-VN")} Points còn lại
              </div>
            </div>
          </div>

          {/* Card 2: Used Quota */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Đã tiêu thụ
              </span>
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-foreground">
                ${usage.usedUsd.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {usage.usedQuota.toLocaleString("vi-VN")} Points đã dùng
              </div>
            </div>
          </div>

          {/* Card 3: Consumption rate (Swiss Tech SVG Radial Gauge) */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Tỷ lệ sử dụng
              </span>
              <span className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                <Layers className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  {/* Background Arc */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-muted/40"
                  />
                  {/* Animated Gauge Arc */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - Math.min(100, Math.max(0, usage.consumptionRate)) / 100)}
                    strokeLinecap="round"
                    className={`transition-all duration-700 ease-out ${
                      usage.consumptionRate > 85
                        ? "text-rose-500"
                        : usage.consumptionRate > 60
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {usage.consumptionRate}%
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Đã dùng
                  </span>
                </div>
              </div>
              <div className="mt-1 text-center text-xs text-muted-foreground">
                Tổng cấp: <strong className="text-foreground font-semibold">${usage.totalGrantedUsd !== undefined ? usage.totalGrantedUsd.toFixed(2) : (usage.balanceUsd + usage.usedUsd).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Card 4: Key Info */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                API Key liên kết
              </span>
              <span className="rounded-lg bg-muted/60 p-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
                <span className="truncate">{usage.maskedKey}</span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition shrink-0"
                  title="Copy masked key"
                >
                  {copiedKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{usage.status === "ACTIVE" ? "Đang hoạt động" : usage.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Logs Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Table header / filter bar */}
        <div className="p-4 sm:p-5 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Nhật ký Request & Độ trễ thời gian thực</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hiển thị độ trễ phản hồi, trạng thái HTTP, token prompt/completion và quota points đã dùng.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Quick model filter pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "", label: "Tất cả" },
                { id: "claude", label: "Claude 5.5" },
                { id: "gpt-6", label: "GPT-6" },
                { id: "gemini", label: "Gemini 4" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setModelFilter(pill.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition inline-flex items-center justify-center ${
                    modelFilter.toLowerCase() === pill.id.toLowerCase()
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Lọc tên model..."
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Table rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Độ trễ</th>
                <th className="px-4 py-3 text-right">Prompt Tokens</th>
                <th className="px-4 py-3 text-right">Completion Tokens</th>
                <th className="px-4 py-3 text-right">Tổng Tokens</th>
                <th className="px-4 py-3 text-right">Quota Points</th>
                <th className="px-4 py-3 text-right">Chi phí ($USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    {apiKey
                      ? "Chưa có request nào được ghi nhận hoặc không khớp bộ lọc."
                      : "Vui lòng nhập API Key phía trên để tải dữ liệu."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const latencyVal = (log as any).use_time || (log as any).latency;
                  const latencyDisplay = latencyVal ? `${Math.round(latencyVal)}ms` : "--";

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition">
                      <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                          {log.model_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          {log.status || 200} OK
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {latencyDisplay}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {log.prompt_tokens.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {log.completion_tokens.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                        {log.total_tokens.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-card-foreground font-medium">
                        {log.quota.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        ${log.costUsd.toFixed(4)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalLogs > pageSize && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Trang <span className="font-semibold text-foreground">{page}</span> / {totalPages} (Tổng {totalLogs} logs)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted/40 disabled:opacity-40 transition"
                title="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted/40 disabled:opacity-40 transition"
                title="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
