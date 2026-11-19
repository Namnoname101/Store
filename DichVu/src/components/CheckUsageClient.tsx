"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Key,
  Search,
  Eye,
  EyeOff,
  ClipboardPaste,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BarChart3,
  ListOrdered,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Activity,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { DEFAULT_CLAUDE_MODEL_ID } from "@/lib/constants/ai-models";

interface UsageData {
  totalCost?: number;
  totalRequests?: number;
  totalTokens?: number;
  tokenLimit?: number;
  costLimit?: number;
  dailyCostLimit?: number;
  dailyCostUsed?: number;
  fallbackRemainPercent?: number;
  fallbackWeeklyRemainPercent?: number;
  dailyCostPercent?: number;
  expiresAt?: string;
  status?: string;
  tierName?: string;
}

interface DailyRow {
  date: string;
  daily_requests?: number;
  requests?: number;
  daily_input_tokens?: number;
  input_tokens?: number;
  daily_output_tokens?: number;
  output_tokens?: number;
  daily_cached_tokens?: number;
  cached_tokens?: number;
  cache_read?: number;
  daily_cache_creation_tokens?: number;
  cache_creation_tokens?: number;
  cache_write?: number;
  daily_tokens?: number;
  tokens?: number;
  daily_cost?: number;
  cost?: number;
}

interface OverageData {
  allow_overage?: boolean;
  allowOverage?: boolean;
  daily_cost_limit?: number;
  dailyCostLimit?: number;
  daily_overage_limit?: number;
  dailyOverageLimit?: number;
  today_overage_amount?: number;
  todayOverageAmount?: number;
  total_overage?: number;
  totalOverage?: number;
  overage_reset_at?: string;
  overageResetAt?: string;
  days?: Array<{
    date: string;
    daily_cost?: number;
    overage_cost?: number;
  }>;
}

interface RequestItem {
  id?: string | number;
  timestamp?: string;
  created_at?: string;
  time?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
  reasoning_tokens?: number;
  cost?: number;
  latency?: number;
  status?: string | number;
}

interface RequestsPayload {
  requests?: RequestItem[];
  total?: number;
  summary?: {
    totalCost?: number;
    cost?: number;
    inputTokens?: number;
    outputTokens?: number;
    reasoningTokens?: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
}

export default function CheckUsageClient() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [directUrl, setDirectUrl] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"overview" | "daily" | "overage" | "requests">("overview");

  // Result States
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [dailyData, setDailyData] = useState<DailyRow[]>([]);
  const [overageData, setOverageData] = useState<OverageData | null>(null);

  // Requests Tab States
  const [requestsPayload, setRequestsPayload] = useState<RequestsPayload | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsPage, setRequestsPage] = useState(1);
  const requestsLimit = 20;

  // Auto-fill from URL query param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlKey = params.get("key") || params.get("apiKey");
      if (urlKey && urlKey.trim()) {
        const cleaned = urlKey.trim();
        setApiKey(cleaned);
        fetchUsageData(cleaned);
      }
    }
  }, []);

  const maskKey = useCallback((key: string) => {
    if (!key) return "••••••••";
    if (key.length <= 12) return key;
    return `${key.slice(0, 7)}...${key.slice(-4)}`;
  }, []);

  const formatUsd = (val?: number) => {
    const num = Number(val || 0);
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  };

  const formatCompactNumber = (val?: number) => {
    const num = Number(val || 0);
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString("en-US");
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Không giới hạn";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Main fetch function
  const fetchUsageData = async (keyToFetch: string) => {
    const trimmed = keyToFetch.trim();
    if (!trimmed) {
      setErrorMsg("Vui lòng nhập API Key.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setDirectUrl(null);
    setSuccessMsg(null);
    setRequestsPayload(null);
    setRequestsPage(1);

    try {
      const res = await fetch("/api/check-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok || body.success === false) {
        throw new Error(body.error || `Lỗi phản hồi (${res.status})`);
      }

      setUsageData(body.usage || null);
      setDailyData(Array.isArray(body.daily) ? body.daily : []);
      setOverageData(body.overage || null);

      setSuccessMsg("Tra cứu thành công thông tin API Key!");

      // If on requests tab, fetch requests immediately
      if (activeTab === "requests") {
        fetchRequests(trimmed, 1);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể tải dữ liệu kiểm tra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Requests pagination
  const fetchRequests = async (keyToFetch: string, pageNum: number) => {
    if (!keyToFetch.trim()) return;
    setRequestsLoading(true);
    try {
      const res = await fetch("/api/check-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: keyToFetch.trim(),
          action: "requests",
          page: pageNum,
          limit: requestsLimit,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success !== false) {
        setRequestsPayload(body);
        setRequestsPage(pageNum);
      }
    } catch (err) {
      console.error("fetchRequests error:", err);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Switch tab trigger
  const handleTabChange = (tab: "overview" | "daily" | "overage" | "requests") => {
    setActiveTab(tab);
    if (tab === "requests" && apiKey.trim() && !requestsPayload && !requestsLoading) {
      fetchRequests(apiKey, requestsPage);
    }
  };

  // Calculate percentages
  const { remainingPercent, creditUsedPercent } = useMemo(() => {
    if (!usageData) return { remainingPercent: 100, creditUsedPercent: 0 };

    const totalCost = Number(usageData.totalCost || 0);
    const costLimit = Number(usageData.costLimit || 0);
    const dailyCostLimit = Number(usageData.dailyCostLimit || 0);
    const dailyCostUsed = Number(usageData.dailyCostUsed || 0);
    const fallbackRemain = usageData.fallbackRemainPercent;

    const usedPercent = costLimit > 0 ? Math.min(100, Math.max(0, (totalCost / costLimit) * 100)) : 0;

    let remPercent = 100;
    if (fallbackRemain !== null && fallbackRemain !== undefined && Number.isFinite(Number(fallbackRemain))) {
      remPercent = Math.min(100, Math.max(0, Number(fallbackRemain)));
    } else if (dailyCostLimit > 0) {
      const dailyUsedPct = (dailyCostUsed / dailyCostLimit) * 100;
      remPercent = Math.min(100, Math.max(0, 100 - dailyUsedPct));
    } else if (usageData.dailyCostPercent !== null && usageData.dailyCostPercent !== undefined) {
      remPercent = Math.min(100, Math.max(0, 100 - Number(usageData.dailyCostPercent)));
    } else if (costLimit > 0) {
      remPercent = Math.max(0, 100 - usedPercent);
    }

    return {
      remainingPercent: remPercent,
      creditUsedPercent: usedPercent,
    };
  }, [usageData]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setApiKey(text.trim());
        fetchUsageData(text.trim());
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 px-4 sm:px-6 py-6">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 backdrop-blur-sm">
          <Zap className="h-3.5 w-3.5 text-purple-700 dark:text-purple-300" />
          <span>Hệ Thống Tra Cứu Quota & Usage Thời Gian Thực</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Kiểm Tra Hạn Mức{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            API Claude & Cursor
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground">
          Tra cứu số dư credit, hạn mức ngày, nhật ký request và tình trạng hoạt động của API Key mua tại KhoDEE hoặc đối tác.
        </p>
      </div>

      {/* Input Box Card */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs backdrop-blur-md">
        <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2.5">
          Nhập mã API Key (sk-ant-api... hoặc sk-...)
        </label>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Key className="h-4 w-4" />
            </div>

            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchUsageData(apiKey);
              }}
              placeholder="Dán mã API Key tại đây (sk-ant-...)"
              className="w-full min-h-[44px] rounded-xl border border-input bg-background pl-10 pr-24 py-2.5 text-sm font-mono text-foreground placeholder-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all"
            />

            <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title={showKey ? "Ẩn Key" : "Hiện Key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={handlePaste}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Dán từ Clipboard"
              >
                <ClipboardPaste className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={loading || !apiKey.trim()}
            onClick={() => fetchUsageData(apiKey)}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-6 py-2.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Kiểm tra ngay</span>
              </>
            )}
          </button>
        </div>

        {/* Status notice */}
        {errorMsg && (
          <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
            {directUrl && (
              <div className="pt-1">
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-sm"
                >
                  <span>Mở cổng tra cứu dự phòng</span>
                  <ArrowUpRight className="h-4 w-4 text-rose-100" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Fallback direct link note */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>💡 Nếu hệ thống tự động bận, bạn có thể tra cứu tại cổng dự phòng:</span>
          <a
            href="https://genzshop.vn/check-usage"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center gap-1 text-primary hover:underline font-semibold"
          >
            <span>Cổng tra cứu dự phòng</span>
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>

        {successMsg && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* DASHBOARD SECTION WHEN DATA IS LOADED */}
      {usageData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Còn lại */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Hạn mức khả dụng</span>
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground font-mono tracking-tight">
                  {remainingPercent.toFixed(1)}%
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Còn lại</span>
              </div>
              <div className="mt-3 w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${remainingPercent}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Key: <code className="text-foreground font-mono font-medium">{maskKey(apiKey)}</code>
              </p>
            </div>

            {/* Card 2: Chi phí & Hạn mức */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Tổng chi phí</span>
                <DollarSign className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-foreground font-mono tracking-tight">
                {formatUsd(usageData.totalCost)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Hạn mức tối đa:{" "}
                <span className="font-semibold text-foreground">
                  {usageData.costLimit ? formatUsd(usageData.costLimit) : "Không giới hạn"}
                </span>
              </p>
              <div className="mt-3 w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${creditUsedPercent}%` }}
                />
              </div>
            </div>

            {/* Card 3: Tổng Requests */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Tổng Requests</span>
                <TrendingUp className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-foreground font-mono tracking-tight">
                {formatCompactNumber(usageData.totalRequests)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Hôm nay đã dùng:{" "}
                <span className="font-semibold text-purple-600 dark:text-purple-300 font-mono">
                  {formatUsd(usageData.dailyCostUsed)}
                </span>
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Hạn mức ngày: {usageData.dailyCostLimit ? formatUsd(usageData.dailyCostLimit) : "Mặc định"}
              </p>
            </div>

            {/* Card 4: Tổng Tokens */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Tổng Tokens</span>
                <Cpu className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-foreground font-mono tracking-tight">
                {formatCompactNumber(usageData.totalTokens)}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Hết hạn:</span>
                <span className="text-foreground font-medium">{formatDate(usageData.expiresAt)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Trạng thái:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {usageData.status || "Hoạt động"}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => handleTabChange("overview")}
              className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "overview"
                  ? "bg-primary text-primary-foreground shadow-xs border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Layers className={`h-4 w-4 ${activeTab === "overview" ? "text-primary-foreground" : "text-indigo-600 dark:text-indigo-400"}`} />
              <span>Tổng quan</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("daily")}
              className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "daily"
                  ? "bg-primary text-primary-foreground shadow-xs border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Calendar className={`h-4 w-4 ${activeTab === "daily" ? "text-primary-foreground" : "text-cyan-700 dark:text-cyan-400"}`} />
              <span>Theo ngày ({dailyData.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("overage")}
              className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "overage"
                  ? "bg-primary text-primary-foreground shadow-xs border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Activity className={`h-4 w-4 ${activeTab === "overage" ? "text-primary-foreground" : "text-emerald-600 dark:text-emerald-400"}`} />
              <span>Vượt mức (Overage)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("requests")}
              className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "requests"
                  ? "bg-primary text-primary-foreground shadow-xs border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <ListOrdered className={`h-4 w-4 ${activeTab === "requests" ? "text-primary-foreground" : "text-purple-600 dark:text-purple-400"}`} />
              <span>Lịch sử Request</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW DETAILS */}
          {activeTab === "overview" && (
            <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 space-y-5 shadow-xs">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <span>Chi tiết thông số kỹ thuật Key</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/80">
                  <span className="text-muted-foreground">Mã Key nhận dạng:</span>
                  <span className="font-mono font-semibold text-foreground">{maskKey(apiKey)}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/80">
                  <span className="text-muted-foreground">Gói phân hạng (Tier):</span>
                  <span className="font-semibold text-primary">{usageData.tierName || "Gói Tiêu Chuẩn"}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/80">
                  <span className="text-muted-foreground">Hạn mức Token:</span>
                  <span className="font-semibold text-foreground font-mono">
                    {usageData.tokenLimit ? formatCompactNumber(usageData.tokenLimit) : "Không giới hạn"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/80">
                  <span className="text-muted-foreground">Hạn mức Chi phí (Cost limit):</span>
                  <span className="font-semibold text-foreground font-mono">
                    {usageData.costLimit ? formatUsd(usageData.costLimit) : "Không giới hạn"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/80">
                  <span className="text-muted-foreground">Chi phí tiêu thụ hôm nay:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                    {formatUsd(usageData.dailyCostUsed)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/80">
                  <span className="text-muted-foreground">Thời gian hết hạn:</span>
                  <span className="font-medium text-foreground">{formatDate(usageData.expiresAt)}</span>
                </div>
              </div>

              {/* Quick Guide Link Banner */}
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-foreground">
                  Bạn cần kết nối Key này vào <strong>VS Code</strong>, <strong>Claude Desktop</strong> hoặc <strong>Cursor</strong>?
                </div>
                <Link
                  href="/huong-dan/api-claude"
                  className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2.5 rounded-xl transition-all shadow-xs shrink-0"
                >
                  <span>Xem hướng dẫn kết nối 5 nền tảng</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: DAILY TABLE */}
          {activeTab === "daily" && (
            <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
                  <span>Lịch sử sử dụng theo ngày</span>
                </h3>
                <span className="text-xs text-muted-foreground">Tổng cộng {dailyData.length} ngày</span>
              </div>

              {dailyData.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Chưa có dữ liệu tiêu thụ theo ngày cho API Key này.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Ngày</th>
                        <th className="py-3 px-4 text-right">Lượt gọi</th>
                        <th className="py-3 px-4 text-right">Input Tokens</th>
                        <th className="py-3 px-4 text-right">Output Tokens</th>
                        <th className="py-3 px-4 text-right">Cache Read</th>
                        <th className="py-3 px-4 text-right">Tổng Tokens</th>
                        <th className="py-3 px-4 text-right">Chi phí (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono text-muted-foreground">
                      {dailyData.map((row, idx) => {
                        const reqs = row.daily_requests ?? row.requests ?? 0;
                        const inputT = row.daily_input_tokens ?? row.input_tokens ?? 0;
                        const outputT = row.daily_output_tokens ?? row.output_tokens ?? 0;
                        const cachedT = row.daily_cached_tokens ?? row.cached_tokens ?? row.cache_read ?? 0;
                        const totalT = row.daily_tokens ?? row.tokens ?? 0;
                        const cost = row.daily_cost ?? row.cost ?? 0;

                        return (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 font-sans font-medium text-foreground">{row.date}</td>
                            <td className="py-3 px-4 text-right">{formatCompactNumber(reqs)}</td>
                            <td className="py-3 px-4 text-right text-muted-foreground">{formatCompactNumber(inputT)}</td>
                            <td className="py-3 px-4 text-right text-muted-foreground">{formatCompactNumber(outputT)}</td>
                            <td className="py-3 px-4 text-right text-cyan-700 dark:text-cyan-400">{formatCompactNumber(cachedT)}</td>
                            <td className="py-3 px-4 text-right font-bold text-foreground">{formatCompactNumber(totalT)}</td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">{formatUsd(cost)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OVERAGE */}
          {activeTab === "overage" && (
            <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 space-y-5 shadow-xs">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <span>Trạng thái Overage (Tiêu dùng vượt mức)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-muted/40 border border-border text-sm">
                  <span className="text-muted-foreground block text-xs">Trạng thái Overage</span>
                  <span
                    className={`inline-block mt-2 font-bold px-2.5 py-1 rounded-full text-xs ${
                      overageData?.allow_overage || overageData?.allowOverage
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {overageData?.allow_overage || overageData?.allowOverage ? "Đang Bật" : "Không áp dụng"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border text-sm">
                  <span className="text-muted-foreground block text-xs">Hôm nay tiêu vượt</span>
                  <span className="text-xl font-bold font-mono text-foreground mt-1 block">
                    {formatUsd(overageData?.today_overage_amount || overageData?.todayOverageAmount)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border text-sm">
                  <span className="text-muted-foreground block text-xs">Tổng chi phí vượt mức</span>
                  <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1 block">
                    {formatUsd(overageData?.total_overage || overageData?.totalOverage)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border text-sm">
                  <span className="text-muted-foreground block text-xs">Ngày Reset tiếp theo</span>
                  <span className="text-xs font-semibold text-foreground mt-2 block">
                    {formatDate(overageData?.overage_reset_at || overageData?.overageResetAt)}
                  </span>
                </div>
              </div>

              {/* Overage Days Table if any */}
              {overageData?.days && overageData.days.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-border mt-4">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Ngày</th>
                        <th className="py-3 px-4 text-right">Chi phí thực tế</th>
                        <th className="py-3 px-4 text-right">Chi phí vượt mức</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono text-muted-foreground">
                      {overageData.days.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="py-3 px-4 font-sans text-foreground">{row.date}</td>
                          <td className="py-3 px-4 text-right">{formatUsd(row.daily_cost)}</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-700 dark:text-amber-400">
                            {formatUsd(row.overage_cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REQUESTS LOG */}
          {activeTab === "requests" && (
            <div className="rounded-2xl border border-border bg-card text-card-foreground p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-primary" />
                  <span>Nhật ký Request chi tiết (Gần nhất)</span>
                </h3>

                <button
                  type="button"
                  onClick={() => fetchRequests(apiKey, requestsPage)}
                  disabled={requestsLoading}
                  className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted/40 text-xs font-semibold text-foreground transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${requestsLoading ? "animate-spin" : ""}`} />
                  <span>Làm mới nhật ký</span>
                </button>
              </div>

              {/* Summary of Loaded Requests */}
              {requestsPayload?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground block">Tổng Input:</span>
                    <span className="text-foreground font-bold">
                      {formatCompactNumber(requestsPayload.summary.inputTokens)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Tổng Output:</span>
                    <span className="text-foreground font-bold">
                      {formatCompactNumber(requestsPayload.summary.outputTokens)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Cache Read / Write:</span>
                    <span className="text-cyan-700 dark:text-cyan-400 font-bold">
                      {formatCompactNumber(requestsPayload.summary.cacheRead)} /{" "}
                      {formatCompactNumber(requestsPayload.summary.cacheWrite)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Tổng Chi Phí:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      {formatUsd(requestsPayload.summary.totalCost || requestsPayload.summary.cost)}
                    </span>
                  </div>
                </div>
              )}

              {/* Requests Table */}
              {requestsLoading ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  <span>Đang tải danh sách request...</span>
                </div>
              ) : !requestsPayload?.requests || requestsPayload.requests.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Chưa có nhật ký request nào cho API Key này.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="py-3 px-3">Thời gian</th>
                        <th className="py-3 px-3">Mô hình (Model)</th>
                        <th className="py-3 px-3 text-right">Input</th>
                        <th className="py-3 px-3 text-right">Output</th>
                        <th className="py-3 px-3 text-right">Cache</th>
                        <th className="py-3 px-3 text-right">Reasoning</th>
                        <th className="py-3 px-3 text-right">Độ trễ</th>
                        <th className="py-3 px-3 text-right">Chi phí</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono text-muted-foreground">
                      {requestsPayload.requests.map((r, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground font-sans">
                            {formatDate(r.timestamp || r.created_at || r.time)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono font-semibold text-xs">
                              {r.model || DEFAULT_CLAUDE_MODEL_ID}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">{formatCompactNumber(r.input_tokens)}</td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">{formatCompactNumber(r.output_tokens)}</td>
                          <td className="py-2.5 px-3 text-right text-cyan-700 dark:text-cyan-400">
                            {formatCompactNumber(r.cache_read_tokens || r.cache_creation_tokens)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-700 dark:text-amber-400">
                            {r.reasoning_tokens ? formatCompactNumber(r.reasoning_tokens) : "--"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-muted-foreground">
                            {r.latency ? `${Math.round(r.latency)}ms` : "--"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">{formatUsd(r.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {requestsPayload && (requestsPayload.total || 0) > requestsLimit && (
                <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                  <span className="text-muted-foreground">
                    Trang {requestsPage} / {Math.ceil((requestsPayload.total || 0) / requestsLimit)} (Tổng{" "}
                    {requestsPayload.total} requests)
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={requestsPage <= 1 || requestsLoading}
                      onClick={() => fetchRequests(apiKey, requestsPage - 1)}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted/40 disabled:opacity-40 transition-colors"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={
                        requestsPage >= Math.ceil((requestsPayload.total || 0) / requestsLimit) || requestsLoading
                      }
                      onClick={() => fetchRequests(apiKey, requestsPage + 1)}
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted/40 disabled:opacity-40 transition-colors"
                      title="Trang sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State / How to use guide when no data yet */}
      {!usageData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Cập nhật tức thời</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dữ liệu được truy vấn trực tiếp từ hệ thống đối tác máy chủ, đảm bảo số dư và lưu lượng luôn đồng bộ 100%.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Bảo mật Token</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mã Key của bạn không bao giờ bị lưu trữ vào cơ sở dữ liệu khi tra cứu. Kết nối mã hóa SSL chuẩn bảo mật cao.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Đầy đủ 4 danh mục</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Theo dõi hạn mức tổng thể, bảng phân tích theo từng ngày, thông số overage và toàn bộ lịch sử các request.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
