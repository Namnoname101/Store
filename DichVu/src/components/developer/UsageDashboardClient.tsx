"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
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
      const paramKey = urlParams.get("apiKey");
      const storedKey = localStorage.getItem("daitruong_dev_api_key");

      if (paramKey) {
        setApiKey(paramKey);
        setInputKey(paramKey);
        localStorage.setItem("daitruong_dev_api_key", paramKey);
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
        localStorage.setItem("daitruong_dev_api_key", key);
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
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
            <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>DaiTruong Developer Portal</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            API Usage & Real-time Logs
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Theo dõi hạn mức còn lại, tỷ lệ sử dụng và lịch sử request thực tế của API Key.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (apiKey) {
                fetchUsage(apiKey);
                fetchLogs(apiKey, page);
              }
            }}
            disabled={isLoading || !apiKey}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>

          <Link
            href="/codex"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Nạp Thêm Credit</span>
          </Link>
        </div>
      </div>

      {/* API Key input bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
        <form onSubmit={handleApplyKey} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="password"
              placeholder="Nhập API Key của bạn (sk-...) để xem thống kê..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 pl-10 pr-4 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputKey.trim()}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shrink-0"
          >
            Tra cứu
          </button>
        </form>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Low credit alert if applicable */}
      {usage?.isLowCredit && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow transition shrink-0"
          >
            <span>Nạp ngay</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      {usage && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Balance Remaining */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Hạn mức khả dụng
              </span>
              <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2 text-emerald-600 dark:text-emerald-400">
                <Database className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                ${usage.balanceUsd.toFixed(2)}
              </div>
              <div className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {usage.quota.toLocaleString("vi-VN")} Points còn lại
              </div>
            </div>
          </div>

          {/* Card 2: Used Quota */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Đã tiêu thụ
              </span>
              <span className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-2 text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                ${usage.usedUsd.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {usage.usedQuota.toLocaleString("vi-VN")} Points đã dùng
              </div>
            </div>
          </div>

          {/* Card 3: Consumption rate */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Tỷ lệ sử dụng
              </span>
              <span className="rounded-lg bg-purple-50 dark:bg-purple-950/40 p-2 text-purple-600 dark:text-purple-400">
                <Layers className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {usage.consumptionRate}%
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Tổng cấp: ${usage.totalGrantedUsd !== undefined ? usage.totalGrantedUsd.toFixed(2) : (usage.balanceUsd + usage.usedUsd).toFixed(2)}
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    usage.consumptionRate > 80
                      ? "bg-rose-500"
                      : usage.consumptionRate > 50
                      ? "bg-amber-500"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${Math.min(100, usage.consumptionRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Key Info */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                API Key liên kết
              </span>
              <span className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>{usage.maskedKey}</span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="rounded p-1 text-slate-400 hover:text-blue-600"
                  title="Copy masked key"
                >
                  {copiedKey ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{usage.status === "ACTIVE" ? "Đang hoạt động" : usage.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Logs Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Table header / filter bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Nhật ký Request gần đây</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hiển thị chi tiết token prompt, completion và quota points đã dùng.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Lọc theo model (vd: gpt-4o, claude)..."
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Table rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3 text-right">Prompt Tokens</th>
                <th className="px-4 py-3 text-right">Completion Tokens</th>
                <th className="px-4 py-3 text-right">Tổng Tokens</th>
                <th className="px-4 py-3 text-right">Quota Points</th>
                <th className="px-4 py-3 text-right">Chi phí ($USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    {apiKey
                      ? "Chưa có request nào được ghi nhận hoặc không khớp bộ lọc."
                      : "Vui lòng nhập API Key phía trên để tải dữ liệu."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-lg bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                        {log.model_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {log.prompt_tokens.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {log.completion_tokens.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {log.total_tokens.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300 font-medium">
                      {log.quota.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      ${log.costUsd.toFixed(4)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalLogs > pageSize && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Trang <span className="font-semibold text-slate-900 dark:text-white">{page}</span> / {totalPages} (Tổng {totalLogs} logs)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300 disabled:opacity-40"
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
