"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  KeyRound,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import type { AdminProductItem } from "@/services/admin.service";

interface InventoryImporterClientProps {
  initialProducts: AdminProductItem[];
}

export default function InventoryImporterClient({
  initialProducts,
}: InventoryImporterClientProps) {
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productId") || "";

  const [products, setProducts] = useState<AdminProductItem[]>(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProductId || initialProducts[0]?.id || ""
  );
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
    count?: number;
  } | null>(null);

  // If search param changes or is present initially
  useEffect(() => {
    if (preselectedProductId && products.some((p) => p.id === preselectedProductId)) {
      setSelectedProductId(preselectedProductId);
    }
  }, [preselectedProductId, products]);

  // Live count lines
  const parsedKeysCount = useMemo(() => {
    if (!rawText.trim()) return 0;
    return rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0).length;
  }, [rawText]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setAlert({ type: "error", message: "Vui lòng chọn sản phẩm cần nhập kho" });
      return;
    }
    if (parsedKeysCount === 0) {
      setAlert({ type: "error", message: "Vui lòng nhập ít nhất một key hoặc tài khoản hợp lệ" });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const res = await fetch("/api/admin/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          rawText,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Nhập kho thất bại");
      }

      // Update local product inventory count
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === selectedProductId) {
            return {
              ...p,
              availableStock: p.availableStock + data.count,
              totalStock: p.totalStock + data.count,
            };
          }
          return p;
        })
      );

      setAlert({
        type: "success",
        message: `Đã nhập kho thành công ${data.count} key/tài khoản cho "${selectedProduct?.title || "Sản phẩm"}"!`,
        count: data.count,
      });

      // Clear input
      setRawText("");
    } catch (err: any) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Nhập kho hàng loạt (Bulk Key Importer)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Dán hàng trăm key bản quyền, tài khoản hoặc liên kết tải vào hệ thống chỉ với một cú nhấp chuột.
        </p>
      </div>

      {/* Alert banner */}
      {alert && (
        <div
          className={`flex items-start justify-between p-4 rounded-xl border text-sm ${
            alert.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-3">
            {alert.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <div>
              <p className="font-semibold">{alert.message}</p>
              {alert.type === "success" && (
                <p className="text-xs text-emerald-500/80 mt-0.5">
                  Kho hàng đã được cập nhật và sẵn sàng giao tự động cho khách mua tiếp theo.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Bulk Importer Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <form onSubmit={handleImport} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1. Chọn sản phẩm cần nhập *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white font-medium focus:border-indigo-500 focus:outline-none"
              >
                {products.length === 0 ? (
                  <option value="">Chưa có sản phẩm nào</option>
                ) : (
                  products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (Kho hiện tại: {p.availableStock} | {p.category?.name || "Chung"})
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedProduct && (
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Loại sản phẩm:</span>
                  <span className="ml-2 font-mono text-indigo-400 font-bold">
                    {selectedProduct.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-slate-400">Khả dụng:</span>
                    <span className="ml-1.5 font-bold text-emerald-400">
                      {selectedProduct.availableStock}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Đã bán:</span>
                    <span className="ml-1.5 font-bold text-slate-300">
                      {selectedProduct.soldStock}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Danh sách Key / Tài khoản / Đường dẫn (Mỗi dòng một mục) *
              </label>
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                Phát hiện: <strong>{parsedKeysCount}</strong> mục
              </span>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`W269N-WFGWX-YVC9B-4J6C9-T83GX\nMH37W-N47XK-V7XM9-C7227-GCQG9\nnetflix_pro_01@gmail.com|MatKhau123!\nhttps://drive.google.com/drive/folders/abcdef...`}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>
                Hệ thống tự động loại bỏ dòng trống và khoảng trắng thừa. Mỗi dòng tương ứng 1 bản ghi được bán cho 1 khách hàng.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRawText("")}
              disabled={loading || !rawText}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-40"
            >
              Xóa trắng ô nhập
            </button>
            <button
              type="submit"
              disabled={loading || parsedKeysCount === 0 || !selectedProductId}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang nhập kho...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Nhập kho {parsedKeysCount > 0 ? `(${parsedKeysCount} key)` : ""}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Current Stock Status Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Tình trạng kho hàng hiện tại</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Theo dõi chi tiết số lượng key sẵn sàng bàn giao, đang chờ giữ hàng hoặc đã bán.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Tên sản phẩm</th>
                  <th className="px-5 py-3.5 font-semibold">Danh mục</th>
                  <th className="px-5 py-3.5 font-semibold">Loại</th>
                  <th className="px-5 py-3.5 font-semibold text-emerald-400">Khả dụng (AVAILABLE)</th>
                  <th className="px-5 py-3.5 font-semibold text-amber-400">Đang giữ (RESERVED)</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-400">Đã bán (SOLD)</th>
                  <th className="px-5 py-3.5 font-semibold text-white">Tổng cộng</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">
                      Chưa có sản phẩm nào trong hệ thống.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.availableStock <= 5;
                    const isSelected = p.id === selectedProductId;
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-800/30 transition-colors ${
                          isSelected ? "bg-indigo-600/10" : ""
                        }`}
                      >
                        <td className="px-5 py-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{p.title}</span>
                            {isLow && (
                              <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
                                <AlertTriangle className="h-3 w-3" />
                                Sắp hết
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">
                          {p.category?.name || "Chung"}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-indigo-400">
                          {p.type}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              isLow
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {p.availableStock}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-amber-400 font-medium">
                          {p.reservedStock}
                        </td>
                        <td className="px-5 py-4 text-slate-400">
                          {p.soldStock}
                        </td>
                        <td className="px-5 py-4 font-bold text-white">
                          {p.totalStock}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedProductId(p.id);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                            }`}
                          >
                            {isSelected ? "Đang chọn" : "Chọn nhập"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
