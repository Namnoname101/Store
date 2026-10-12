"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Database,
  TrendingUp,
  ShieldCheck,
  Scale,
  Users,
  RotateCw,
  Search,
} from "lucide-react";

interface SnapshotData {
  id: string;
  sourceQuotaTotal: number;
  sourceQuotaUsed: number;
  sourceBalanceUsd: number;
  totalCustomerObligationQuota: number;
  status: string;
  createdAt: string;
}

export default function AdminCodexClient() {
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [bindings, setBindings] = useState<any[]>([]);
  const [reconcileOrders, setReconcileOrders] = useState<any[]>([]);
  const [ledgerDiscrepancies, setLedgerDiscrepancies] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"reconcile" | "bindings" | "ledger">("reconcile");
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [snapRes, bindRes, recRes] = await Promise.all([
        fetch("/api/admin/codex/snapshot"),
        fetch("/api/admin/codex/bindings"),
        fetch("/api/admin/codex/reconcile"),
      ]);

      if (snapRes.ok) {
        const d = await snapRes.json();
        setSnapshot(d.snapshot);
      }
      if (bindRes.ok) {
        const d = await bindRes.json();
        setBindings(d.bindings || []);
      }
      if (recRes.ok) {
        const d = await recRes.json();
        setReconcileOrders(d.reconcileRequiredOrders || []);
        setLedgerDiscrepancies(d.ledgerDiscrepancies || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncSnapshot = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/admin/codex/snapshot", { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setSnapshot(d.snapshot);
      }
    } catch {
      // Ignore
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryOrder = async (orderId: string) => {
    setRetryingOrderId(orderId);
    try {
      const res = await fetch("/api/admin/codex/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch {
      // Ignore
    } finally {
      setRetryingOrderId(null);
    }
  };

  const filteredBindings = bindings.filter((b) =>
    searchKey
      ? b.maskedKey.toLowerCase().includes(searchKey.toLowerCase()) ||
        (b.keyName && b.keyName.toLowerCase().includes(searchKey.toLowerCase())) ||
        (b.guestEmail && b.guestEmail.toLowerCase().includes(searchKey.toLowerCase())) ||
        (b.user?.email && b.user.email.toLowerCase().includes(searchKey.toLowerCase()))
      : true
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-0.5 text-xs font-semibold text-purple-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Admin Codex & ModelAPI Oversight</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white">
            Giám Sát Hạn Mức Upstream & Đối Soát Sổ Cái
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Kiểm tra số dư tài khoản tổng upstream, tỷ lệ đệm nghĩa vụ khách hàng và xử lý đơn lỗi.
          </p>
        </div>

        <button
          onClick={handleSyncSnapshot}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>Đồng bộ Snapshot Upstream</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Source Quota */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Số dư tài khoản tổng</span>
            <Database className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              ${snapshot ? snapshot.sourceBalanceUsd.toFixed(2) : "0.00"}
            </div>
            <div className="mt-1 text-xs text-purple-400 font-mono">
              +{snapshot ? snapshot.sourceQuotaTotal.toLocaleString("vi-VN") : "0"} Points
            </div>
          </div>
        </div>

        {/* Card 2: Customer Obligations */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Nghĩa vụ với khách hàng</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {snapshot ? snapshot.totalCustomerObligationQuota.toLocaleString("vi-VN") : "0"}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Tổng Quota Points đã cam kết cấp
            </div>
          </div>
        </div>

        {/* Card 3: Buffer Health Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tình trạng đệm vốn</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            {snapshot?.status === "HEALTHY" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>AN TOÀN (HEALTHY)</span>
              </span>
            )}
            {snapshot?.status === "WARNING_LOW_BALANCE" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>CẢNH BÁO: SỐ DƯ THẤP</span>
              </span>
            )}
            {snapshot?.status === "CRITICAL" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>NGUY HIỂM: CẦN NẠP NGUỒN</span>
              </span>
            )}
            <p className="mt-2 text-[11px] text-slate-500">
              Tỷ lệ nguồn / nghĩa vụ cam kết
            </p>
          </div>
        </div>

        {/* Card 4: Total Active Bindings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>API Key đã liên kết</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {bindings.length}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Đang hoạt động trong hệ thống
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("reconcile")}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === "reconcile"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Cần đối soát & Lỗi ({reconcileOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === "ledger"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <RotateCw className="h-4 w-4" />
          <span>Sổ cái sai lệch Delta ({ledgerDiscrepancies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("bindings")}
          className={`pb-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === "bindings"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Danh sách API Key ({bindings.length})</span>
        </button>
      </div>

      {/* Tab 1: Reconcile Required Orders */}
      {activeTab === "reconcile" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">
              Danh sách đơn cần đối soát hoặc gặp sự cố upstream
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Các đơn nạp gặp lỗi mạng hoặc quota chưa được xác nhận đồng bộ với ModelAPI.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Key nhận</th>
                  <th className="px-4 py-3">Gói USD</th>
                  <th className="px-4 py-3">Quota</th>
                  <th className="px-4 py-3">Lỗi chi tiết</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reconcileOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Không có đơn hàng nào cần đối soát. Toàn bộ đơn nạp hoạt động hoàn hảo!
                    </td>
                  </tr>
                ) : (
                  reconcileOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {ord.orderCode}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {ord.creditTopupOrder?.binding?.maskedKey || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-purple-400 font-bold">
                        ${ord.creditTopupOrder?.creditUsd}
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-mono">
                        +{ord.creditTopupOrder?.quotaUnits.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-rose-400 max-w-xs truncate">
                        {ord.creditTopupOrder?.errorMessage || ord.upstreamError || "Lỗi timeout"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRetryOrder(ord.id)}
                          disabled={retryingOrderId === ord.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-[11px] font-bold text-white transition disabled:opacity-50"
                        >
                          <RotateCw
                            className={`h-3 w-3 ${retryingOrderId === ord.id ? "animate-spin" : ""}`}
                          />
                          <span>Nạp lại (Retry)</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Sổ cái sai lệch Delta */}
      {activeTab === "ledger" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">
              Sổ cái đối soát sai lệch đồng thời (Concurrency Delta Ledger)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ghi nhận các trường hợp khách hàng vừa tiêu thụ AI request trong đúng mili-giây diễn ra giao dịch nạp credit.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3 text-right">Quota trước</th>
                  <th className="px-4 py-3 text-right">Dự kiến nạp</th>
                  <th className="px-4 py-3 text-right">Thực tế đọc lại</th>
                  <th className="px-4 py-3 text-right">Sai lệch (Delta)</th>
                  <th className="px-4 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {ledgerDiscrepancies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Không có sai lệch đồng thời nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  ledgerDiscrepancies.map((led) => (
                    <tr key={led.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(led.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {led.binding?.maskedKey || `#${led.upstreamTokenId}`}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        {led.quotaBefore.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">
                        +{led.quotaAddedExpected.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-200">
                        {led.quotaAfterReported.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                        {led.discrepancyDelta.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                        {led.note || "Khớp sổ cái"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Danh sách API Key khách hàng */}
      {activeTab === "bindings" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Danh sách API Key khách hàng liên kết
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý quyền sở hữu, số dư tích lũy đã nạp và trạng thái key.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo key, email, tên..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Masked Key</th>
                  <th className="px-4 py-3">Tên Key</th>
                  <th className="px-4 py-3">Chủ sở hữu</th>
                  <th className="px-4 py-3 text-right">Tổng Credit Đã Nạp</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Lần đồng bộ cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredBindings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Chưa có API Key nào được liên kết.
                    </td>
                  </tr>
                ) : (
                  filteredBindings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {b.maskedKey}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {b.keyName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {b.user?.email || b.user?.username || b.guestEmail || "Khách vãng lai"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-purple-400">
                        ${b.totalCreditUsd.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {b.lastSyncedAt
                          ? new Date(b.lastSyncedAt).toLocaleString("vi-VN")
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
