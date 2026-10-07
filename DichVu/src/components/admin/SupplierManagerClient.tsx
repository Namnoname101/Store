"use client";

import React, { useState, useMemo } from "react";
import {
  Truck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Link as LinkIcon,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  Zap,
  TrendingUp,
  Wallet,
  X,
  Check,
} from "lucide-react";
import { SupplierType, MarkupType } from "@/lib/prisma";

export interface SupplierWithMappings {
  id: string;
  name: string;
  code: string;
  type: string;
  baseUrl: string;
  apiKey: string;
  apiSecret: string | null;
  currentBalance: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  mappings: Array<{
    id: string;
    productId: string;
    supplierId: string;
    supplierProductCode: string;
    supplierPrice: number;
    supplierStock?: number;
    markupType: string;
    markupValue: number;
    isAutoSync: boolean;
    lastSyncAt: Date | string | null;
    product: {
      id: string;
      title: string;
      slug: string;
      price: number;
    };
  }>;
}

export interface ProductMappingItem {
  id: string;
  productId: string;
  supplierId: string;
  supplierProductCode: string;
  supplierPrice: number;
  supplierStock?: number;
  markupType: string;
  markupValue: number;
  isAutoSync: boolean;
  lastSyncAt: Date | string | null;
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
  };
  supplier: {
    id: string;
    name: string;
    code: string;
    type: string;
    isActive: boolean;
  };
}

export interface AvailableProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  fulfillmentType: string;
  isActive: boolean;
  supplierMapping?: {
    id: string;
    supplierId: string;
    supplierProductCode: string;
  } | null;
}

interface SupplierManagerClientProps {
  initialSuppliers: SupplierWithMappings[];
  initialMappings: ProductMappingItem[];
  products: AvailableProduct[];
}

export default function SupplierManagerClient({
  initialSuppliers,
  initialMappings,
  products,
}: SupplierManagerClientProps) {
  const [activeTab, setActiveTab] = useState<"suppliers" | "mappings">("suppliers");
  const [suppliers, setSuppliers] = useState<SupplierWithMappings[]>(initialSuppliers);
  const [mappings, setMappings] = useState<ProductMappingItem[]>(initialMappings);

  // Search & filter
  const [supplierSearch, setSupplierSearch] = useState("");
  const [mappingSearch, setMappingSearch] = useState("");

  // Loading states
  const [checkingBalanceId, setCheckingBalanceId] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [syncingMappingId, setSyncingMappingId] = useState<string | null>(null);

  // Status feedback
  const [alertBanner, setAlertBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Supplier modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierWithMappings | null>(null);
  const [supplierFormData, setSupplierFormData] = useState<{
    name: string;
    code: string;
    type: string;
    baseUrl: string;
    apiKey: string;
    apiSecret: string;
    isActive: boolean;
  }>({
    name: "",
    code: "",
    type: SupplierType.TAPHOAMMO,
    baseUrl: "https://api.taphoammo.net",
    apiKey: "",
    apiSecret: "",
    isActive: true,
  });

  // Mapping modal
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ProductMappingItem | null>(null);
  const [mappingFormData, setMappingFormData] = useState<{
    productId: string;
    supplierId: string;
    supplierProductCode: string;
    supplierPrice: number;
    markupType: string;
    markupValue: number;
    isAutoSync: boolean;
    syncNow: boolean;
  }>({
    productId: "",
    supplierId: "",
    supplierProductCode: "",
    supplierPrice: 50000,
    markupType: MarkupType.PERCENTAGE,
    markupValue: 20,
    isAutoSync: true,
    syncNow: true,
  });

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Chưa đồng bộ";
    return new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Preview calculated retail price in mapping modal
  const previewRetailPrice = useMemo(() => {
    const cost = Number(mappingFormData.supplierPrice) || 0;
    const val = Number(mappingFormData.markupValue) || 0;
    let base = cost;
    if (mappingFormData.markupType === MarkupType.PERCENTAGE) {
      base = cost * (1 + val / 100);
    } else {
      base = cost + val;
    }
    if (base < 1000) {
      return Math.max(cost, Math.round(base));
    }
    let rounded = Math.round(base / 1000) * 1000;
    return Math.max(cost, rounded);
  }, [mappingFormData.supplierPrice, mappingFormData.markupType, mappingFormData.markupValue]);

  // Statistics
  const stats = useMemo(() => {
    const activeSuppliers = suppliers.filter((s) => s.isActive).length;
    const totalBalance = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);
    const totalMappings = mappings.length;
    const autoSyncCount = mappings.filter((m) => m.isAutoSync).length;

    return {
      activeSuppliers,
      totalBalance,
      totalMappings,
      autoSyncCount,
    };
  }, [suppliers, mappings]);

  // Filtered lists
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.baseUrl.toLowerCase().includes(supplierSearch.toLowerCase())
    );
  }, [suppliers, supplierSearch]);

  const filteredMappings = useMemo(() => {
    return mappings.filter(
      (m) =>
        m.product.title.toLowerCase().includes(mappingSearch.toLowerCase()) ||
        m.supplier.name.toLowerCase().includes(mappingSearch.toLowerCase()) ||
        m.supplierProductCode.toLowerCase().includes(mappingSearch.toLowerCase())
    );
  }, [mappings, mappingSearch]);

  // Check balance action
  const handleCheckBalance = async (supplierId: string) => {
    try {
      setCheckingBalanceId(supplierId);
      setAlertBanner(null);
      const res = await fetch(`/api/admin/suppliers/${supplierId}/balance`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === supplierId ? { ...s, currentBalance: data.balance } : s
          )
        );
        setAlertBanner({
          type: "success",
          message: `Đã cập nhật số dư ví: ${formatVND(data.balance)}`,
        });
      } else {
        setAlertBanner({
          type: "error",
          message: data.error || "Không thể kiểm tra số dư từ API sàn",
        });
      }
    } catch (err: any) {
      setAlertBanner({
        type: "error",
        message: err?.message || "Lỗi kết nối kiểm tra số dư",
      });
    } finally {
      setCheckingBalanceId(null);
    }
  };

  // Toggle supplier active
  const handleToggleSupplierActive = async (supplier: SupplierWithMappings) => {
    try {
      const nextActive = !supplier.isActive;
      const res = await fetch(`/api/admin/suppliers/${supplier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === supplier.id ? { ...s, isActive: nextActive } : s))
        );
        setAlertBanner({
          type: "success",
          message: `Đã ${nextActive ? "kích hoạt" : "tạm dừng"} nhà cung cấp ${supplier.name}`,
        });
      } else {
        setAlertBanner({
          type: "error",
          message: data.error || "Không thể thay đổi trạng thái nhà cung cấp",
        });
      }
    } catch (err: any) {
      setAlertBanner({
        type: "error",
        message: err?.message || "Lỗi khi cập nhật trạng thái",
      });
    }
  };

  // 1-Click Bulk Sync
  const handleBulkSync = async () => {
    try {
      setIsBulkSyncing(true);
      setAlertBanner(null);
      const res = await fetch("/api/admin/suppliers/sync", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const result = data.result;
        setAlertBanner({
          type: "success",
          message: `Đồng bộ hoàn tất: ${result.syncedCount}/${result.totalMappings} sản phẩm thành công (${result.pausedCount} tạm ngắt vì hết hàng).`,
        });
        // Refetch or update mappings lastSyncAt
        setMappings((prev) =>
          prev.map((m) => ({ ...m, lastSyncAt: new Date().toISOString() }))
        );
      } else {
        setAlertBanner({
          type: "error",
          message: data.error || "Quá trình đồng bộ gặp sự cố",
        });
      }
    } catch (err: any) {
      setAlertBanner({
        type: "error",
        message: err?.message || "Lỗi kết nối khi đồng bộ toàn bộ",
      });
    } finally {
      setIsBulkSyncing(false);
    }
  };

  // Sync single mapping
  const handleSyncSingleMapping = async (mappingId: string) => {
    try {
      setSyncingMappingId(mappingId);
      setAlertBanner(null);
      const res = await fetch("/api/admin/suppliers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappingId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const item = data.result;
        setMappings((prev) =>
          prev.map((m) =>
            m.id === mappingId
              ? {
                  ...m,
                  supplierPrice: item.supplierPrice,
                  supplierStock: item.inStock,
                  lastSyncAt: new Date().toISOString(),
                  product: {
                    ...m.product,
                    price: item.retailPrice,
                  },
                }
              : m
          )
        );
        setAlertBanner({
          type: "success",
          message: `Đồng bộ thành công! Giá vốn: ${formatVND(item.supplierPrice)} ➔ Giá bán: ${formatVND(item.retailPrice)} (Tồn sàn: ${item.inStock})`,
        });
      } else {
        setAlertBanner({
          type: "error",
          message: data.error || "Đồng bộ thất bại",
        });
      }
    } catch (err: any) {
      setAlertBanner({
        type: "error",
        message: err?.message || "Lỗi khi đồng bộ sản phẩm",
      });
    } finally {
      setSyncingMappingId(null);
    }
  };

  // Supplier modal handlers
  const openNewSupplierModal = () => {
    setEditingSupplier(null);
    setSupplierFormData({
      name: "",
      code: "",
      type: SupplierType.TAPHOAMMO,
      baseUrl: "https://api.taphoammo.net",
      apiKey: "",
      apiSecret: "",
      isActive: true,
    });
    setIsSupplierModalOpen(true);
  };

  const openEditSupplierModal = (supplier: SupplierWithMappings) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name,
      code: supplier.code,
      type: supplier.type,
      baseUrl: supplier.baseUrl,
      apiKey: supplier.apiKey,
      apiSecret: supplier.apiSecret || "",
      isActive: supplier.isActive,
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = Boolean(editingSupplier);
      const url = isEdit
        ? `/api/admin/suppliers/${editingSupplier!.id}`
        : "/api/admin/suppliers";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierFormData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (isEdit) {
          setSuppliers((prev) =>
            prev.map((s) => (s.id === editingSupplier!.id ? { ...s, ...data.supplier } : s))
          );
        } else {
          setSuppliers((prev) => [data.supplier, ...prev]);
        }
        setIsSupplierModalOpen(false);
        setAlertBanner({
          type: "success",
          message: isEdit
            ? `Đã cập nhật nhà cung cấp ${data.supplier.name}`
            : `Đã thêm nhà cung cấp mới ${data.supplier.name}`,
        });
      } else {
        setAlertBanner({
          type: "error",
          message: data.error || "Không thể lưu thông tin nhà cung cấp",
        });
      }
    } catch (err: any) {
      setAlertBanner({
        type: "error",
        message: err?.message || "Lỗi khi lưu nhà cung cấp",
      });
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này? Các liên kết sản phẩm cũng sẽ bị gỡ.")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/suppliers/${supplierId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
        setMappings((prev) => prev.filter((m) => m.supplierId !== supplierId));
        setAlertBanner({
          type: "success",
          message: "Đã xóa nhà cung cấp thành công",
        });
      } else {
        setAlertBanner({
          type: "error",
          message: data.error || "Không thể xóa nhà cung cấp",
        });
      }
    } catch (err: any) {
      setAlertBanner({
        type: "error",
        message: err?.message || "Lỗi khi xóa nhà cung cấp",
      });
    }
  };

  // Mapping modal handlers
  const openNewMappingModal = () => {
    setEditingMapping(null);
    const firstProduct = products[0]?.id || "";
    const firstSupplier = suppliers[0]?.id || "";
    setMappingFormData({
      productId: firstProduct,
      supplierId: firstSupplier,
      supplierProductCode: "",
      supplierPrice: 50000,
      markupType: MarkupType.PERCENTAGE,
      markupValue: 20,
      isAutoSync: true,
      syncNow: true,
    });
    setIsMappingModalOpen(true);
  };

  const openEditMappingModal = (mapping: ProductMappingItem) => {
    setEditingMapping(mapping);
    setMappingFormData({
      productId: mapping.productId,
      supplierId: mapping.supplierId,
      supplierProductCode: mapping.supplierProductCode,
      supplierPrice: mapping.supplierPrice,
      markupType: mapping.markupType,
      markupValue: mapping.markupValue,
      isAutoSync: mapping.isAutoSync,
      syncNow: false,
    });
    setIsMappingModalOpen(true);
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/suppliers/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingMapping ? { id: editingMapping.id } : {}),
          ...mappingFormData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const saved = data.mapping;
        if (editingMapping) {
          setMappings((prev) =>
            prev.map((m) => (m.id === editingMapping.id ? saved : m))
          );
        } else {
          setMappings((prev) => [
            saved,
            ...prev.filter((m) => m.productId !== saved.productId),
          ]);
        }
        setIsMappingModalOpen(false);
        setAlertBanner({
          type: "success",
          message: "Đã lưu liên kết sản phẩm dropshipping thành công!",
        });
      } else {
        setAlertBanner({
          type: "error",
          message: data.error || "Không thể lưu liên kết sản phẩm",
        });
      }
    } catch (err: any) {
      setAlertBanner({
        type: "error",
        message: err?.message || "Lỗi khi lưu liên kết sản phẩm",
      });
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy liên kết sản phẩm này? Sản phẩm sẽ chuyển về dạng Kho cục bộ.")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/suppliers/mappings?id=${mappingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMappings((prev) => prev.filter((m) => m.id !== mappingId));
        setAlertBanner({
          type: "success",
          message: "Đã xóa liên kết sản phẩm",
        });
      } else {
        setAlertBanner({
          type: "error",
          message: data.error || "Không thể xóa liên kết sản phẩm",
        });
      }
    } catch (err: any) {
      setAlertBanner({
        type: "error",
        message: err?.message || "Lỗi khi xóa liên kết",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Truck className="h-6 w-6 text-indigo-400" />
            <span>Quản lý đối tác & Cấp mã tự động (Dropshipping)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kết nối sàn nguồn, theo dõi số dư ví đại lý, và cấu hình tỷ lệ lợi nhuận cho sản phẩm tự động.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "suppliers" ? (
            <button
              onClick={openNewSupplierModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm nhà cung cấp mới</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkSync}
                disabled={isBulkSyncing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 transition-all shadow-md"
              >
                <RefreshCw className={`h-4 w-4 ${isBulkSyncing ? "animate-spin" : ""}`} />
                <span>{isBulkSyncing ? "Đang đồng bộ..." : "Đồng bộ toàn bộ giá & tồn kho ngay"}</span>
              </button>
              <button
                onClick={openNewMappingModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm liên kết sản phẩm</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Nhà cung cấp hoạt động</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {stats.activeSuppliers} <span className="text-xs font-normal text-slate-500">/ {suppliers.length}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Số dư khả dụng sàn</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {formatVND(stats.totalBalance)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Sản phẩm Dropship</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <LinkIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {stats.totalMappings}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tự động đồng bộ (Auto Sync)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300">
            {stats.autoSyncCount}
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {alertBanner && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium ${
            alertBanner.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertBanner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{alertBanner.message}</span>
          </div>
          <button
            onClick={() => setAlertBanner(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "suppliers"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Nhà cung cấp (Suppliers)</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {suppliers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("mappings")}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "mappings"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Liên kết sản phẩm (Product Mappings)</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {mappings.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Suppliers */}
      {activeTab === "suppliers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm theo tên, mã đối tác, URL..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Tên & Mã đối tác</th>
                    <th className="px-5 py-3.5 font-semibold">Loại sàn</th>
                    <th className="px-5 py-3.5 font-semibold">API Endpoint</th>
                    <th className="px-5 py-3.5 font-semibold">Số dư ví (VND)</th>
                    <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                        Chưa có nhà cung cấp nào. Nhấn "Thêm nhà cung cấp mới" để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-white">{supplier.name}</div>
                          <span className="font-mono text-[11px] text-indigo-300 font-semibold">
                            {supplier.code}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-slate-700">
                            {supplier.type}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-400 max-w-[200px] truncate">
                          {supplier.baseUrl}
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                          {formatVND(supplier.currentBalance)}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleToggleSupplierActive(supplier)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all ${
                              supplier.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                supplier.isActive ? "bg-emerald-400" : "bg-slate-500"
                              }`}
                            />
                            {supplier.isActive ? "Hoạt động" : "Tạm dừng"}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleCheckBalance(supplier.id)}
                            disabled={checkingBalanceId === supplier.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 transition-all"
                            title="Kiểm tra số dư API"
                          >
                            <RefreshCw
                              className={`h-3.5 w-3.5 ${
                                checkingBalanceId === supplier.id ? "animate-spin" : ""
                              }`}
                            />
                            <span>{checkingBalanceId === supplier.id ? "Đang tra..." : "Số dư"}</span>
                          </button>

                          <button
                            onClick={() => openEditSupplierModal(supplier)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Product Mappings */}
      {activeTab === "mappings" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm theo sản phẩm, mã sàn, đối tác..."
                value={mappingSearch}
                onChange={(e) => setMappingSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Sản phẩm nội bộ</th>
                    <th className="px-5 py-3.5 font-semibold">Sàn đối tác</th>
                    <th className="px-5 py-3.5 font-semibold">Mã SKU sàn nguồn</th>
                    <th className="px-5 py-3.5 font-semibold">Giá vốn sàn</th>
                    <th className="px-5 py-3.5 font-semibold">Công thức lời</th>
                    <th className="px-5 py-3.5 font-semibold">Giá niêm yết</th>
                    <th className="px-5 py-3.5 font-semibold">Tồn kho sàn</th>
                    <th className="px-5 py-3.5 font-semibold">Tự động đồng bộ</th>
                    <th className="px-5 py-3.5 font-semibold">Lần đồng bộ cuối</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMappings.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-12 text-center text-sm text-slate-500">
                        Chưa có sản phẩm nào được liên kết dropshipping. Nhấn "Thêm liên kết sản phẩm" để cấu hình.
                      </td>
                    </tr>
                  ) : (
                    filteredMappings.map((mapping) => (
                      <tr key={mapping.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{mapping.product.title}</div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {mapping.product.slug}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-200">{mapping.supplier.name}</span>
                          <span className="block text-[11px] text-slate-400 font-mono">
                            {mapping.supplier.code}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-indigo-300">
                          {mapping.supplierProductCode}
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-300">
                          {formatVND(mapping.supplierPrice)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
                            {mapping.markupType === MarkupType.PERCENTAGE
                              ? `+${mapping.markupValue}%`
                              : `+${formatVND(mapping.markupValue)}`}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                          {formatVND(mapping.product.price)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                              (mapping.supplierStock ?? 0) > 0
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                (mapping.supplierStock ?? 0) > 0
                                  ? "bg-emerald-400 animate-pulse"
                                  : "bg-rose-400"
                              }`}
                            />
                            {(mapping.supplierStock ?? 0) > 0
                              ? `Còn ${mapping.supplierStock}`
                              : "Hết hàng"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {mapping.isAutoSync ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              Bật
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400 border border-slate-700">
                              Tắt
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">
                          {formatDate(mapping.lastSyncAt)}
                        </td>
                        <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleSyncSingleMapping(mapping.id)}
                            disabled={syncingMappingId === mapping.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 transition-all"
                            title="Đồng bộ ngay"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${
                                syncingMappingId === mapping.id ? "animate-spin" : ""
                              }`}
                            />
                            <span>{syncingMappingId === mapping.id ? "Đang đồng bộ..." : "Đồng bộ"}</span>
                          </button>

                          <button
                            onClick={() => openEditMappingModal(mapping)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteMapping(mapping.id)}
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                            title="Hủy liên kết"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-400" />
                <span>{editingSupplier ? "Chỉnh sửa Nhà cung cấp" : "Thêm Nhà cung cấp mới"}</span>
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tên nhà cung cấp *</label>
                  <input
                    type="text"
                    required
                    value={supplierFormData.name}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                    placeholder="e.g. Taphoammo.net"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Mã đối tác (Code) *</label>
                  <input
                    type="text"
                    required
                    value={supplierFormData.code}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. TAPHOAMMO"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white uppercase font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Loại sàn tích hợp *</label>
                  <select
                    value={supplierFormData.type}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value={SupplierType.TAPHOAMMO}>TAPHOAMMO (Tạp Hóa MMO)</option>
                    <option value={SupplierType.TRUMTHE}>TRUMTHE (Trùm Thẻ)</option>
                    <option value={SupplierType.LOCKET_VN}>LOCKET_VN (Locket.com.vn Reseller v1)</option>
                    <option value={SupplierType.CUSTOM_REST}>CUSTOM_REST (API Tùy biến)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Trạng thái kích hoạt</label>
                  <div className="pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={supplierFormData.isActive}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, isActive: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span>Đang hoạt động (Kích hoạt mua API)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">API Base URL *</label>
                <input
                  type="url"
                  required
                  value={supplierFormData.baseUrl}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, baseUrl: e.target.value })}
                  placeholder="https://api.taphoammo.net"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">API Key (Access Token) *</label>
                <input
                  type="text"
                  required
                  value={supplierFormData.apiKey}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, apiKey: e.target.value })}
                  placeholder="Khóa API được cấp từ đối tác"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">API Secret (Nếu sàn yêu cầu mã bí mật)</label>
                <input
                  type="text"
                  value={supplierFormData.apiSecret}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, apiSecret: e.target.value })}
                  placeholder="Mã bí mật (Secret / Password)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
                >
                  {editingSupplier ? "Lưu thay đổi" : "Tạo nhà cung cấp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mapping Modal */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                <span>{editingMapping ? "Cấu hình liên kết sản phẩm" : "Thêm liên kết Dropshipping mới"}</span>
              </h3>
              <button
                onClick={() => setIsMappingModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMapping} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Chọn sản phẩm trên website *</label>
                <select
                  required
                  disabled={Boolean(editingMapping)}
                  value={mappingFormData.productId}
                  onChange={(e) => setMappingFormData({ ...mappingFormData, productId: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none disabled:opacity-60"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({formatVND(p.price)}) {p.supplierMapping ? "• [Đã liên kết]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Chọn sàn cung cấp *</label>
                  <select
                    required
                    value={mappingFormData.supplierId}
                    onChange={(e) => setMappingFormData({ ...mappingFormData, supplierId: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Mã SKU / ID bên sàn nguồn *</label>
                  <input
                    type="text"
                    required
                    value={mappingFormData.supplierProductCode}
                    onChange={(e) => setMappingFormData({ ...mappingFormData, supplierProductCode: e.target.value.trim() })}
                    placeholder="e.g. NETFLIX-1M hoặc 423"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Giá vốn sàn (VND)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={mappingFormData.supplierPrice}
                    onChange={(e) => setMappingFormData({ ...mappingFormData, supplierPrice: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Biên lợi nhuận</label>
                  <select
                    value={mappingFormData.markupType}
                    onChange={(e) => setMappingFormData({ ...mappingFormData, markupType: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value={MarkupType.PERCENTAGE}>Tỷ lệ % (+%)</option>
                    <option value={MarkupType.FIXED_AMOUNT}>Số tiền cố định (+đ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Giá trị {mappingFormData.markupType === MarkupType.PERCENTAGE ? "(%)" : "(VND)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={mappingFormData.markupValue}
                    onChange={(e) => setMappingFormData({ ...mappingFormData, markupValue: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Price Preview */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Giá bán niêm yết tự động tính:</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {formatVND(previewRetailPrice)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Lợi nhuận ước tính:{" "}
                  <strong className="text-emerald-300">
                    +{formatVND(previewRetailPrice - (Number(mappingFormData.supplierPrice) || 0))}
                  </strong>{" "}
                  / mỗi đơn hàng.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={mappingFormData.isAutoSync}
                    onChange={(e) => setMappingFormData({ ...mappingFormData, isAutoSync: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span>Tự động đồng bộ giá & tồn kho khi sàn có biến động</span>
                </label>

                {!editingMapping && (
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={mappingFormData.syncNow}
                      onChange={(e) => setMappingFormData({ ...mappingFormData, syncNow: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>Gọi API sàn đồng bộ giá vốn & số lượng ngay lập tức</span>
                  </label>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMappingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
                >
                  {editingMapping ? "Lưu cấu hình" : "Kích hoạt Dropshipping"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
