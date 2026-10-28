"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  Lock,
  Package,
  RefreshCw,
  Save,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { normalizeThumbnailUrl } from "@/lib/catalog-grouping";

export interface SupplierMappingInput {
  id: string;
  supplierName: string;
  supplierProductCode: string;
  supplierPrice: number;
  markupType: string;
  markupValue: number;
  isAutoSync: boolean;
  lastSyncAt: string | null;
}

export interface ProductInput {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  thumbnailUrl: string | null;
  type: string;
  categoryId: string;
  isActive: boolean;
  fulfillmentType: string;
  supplierMapping?: SupplierMappingInput | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  initialProduct: ProductInput;
  categories: CategoryOption[];
}

interface Draft {
  title: string;
  slug: string;
  description: string;
  price: string;
  originalPrice: string;
  thumbnailUrl: string;
  type: string;
  categoryId: string;
  isActive: boolean;
  // Unified Pricing Mode
  isAutoSync: boolean;
  markupType: string;
  markupValue: string;
}

type SaveStatus = "saved" | "pending" | "saving" | "error" | "invalid";
type Tab = "general" | "pricing" | "supplier" | "settings";

function calculateRetailPreview(
  supplierPrice: number,
  markupType: string,
  markupValue: number
): number {
  if (supplierPrice <= 0) return 0;
  let basePrice = supplierPrice;
  if (markupType?.toUpperCase() === "PERCENTAGE") {
    basePrice = supplierPrice * (1 + markupValue / 100);
  } else {
    basePrice = supplierPrice + markupValue;
  }

  let retailPrice: number;
  if (basePrice < 1000) {
    retailPrice = Math.round(basePrice);
  } else {
    retailPrice = Math.round(basePrice / 1000) * 1000;
  }

  if (retailPrice < supplierPrice) {
    retailPrice = supplierPrice;
  }
  return retailPrice;
}

function draftFromProduct(product: ProductInput): Draft {
  const mapping = product.supplierMapping;
  return {
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: String(product.price),
    originalPrice: product.originalPrice === null ? "" : String(product.originalPrice),
    thumbnailUrl: product.thumbnailUrl ?? "",
    type: product.type,
    categoryId: product.categoryId,
    isActive: product.isActive,
    isAutoSync: mapping ? mapping.isAutoSync : false,
    markupType: mapping?.markupType || "PERCENTAGE",
    markupValue: mapping ? String(mapping.markupValue) : "20",
  };
}

function validationError(form: Draft): string | null {
  if (!form.title.trim()) return "Tên sản phẩm không được để trống.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) return "Slug chỉ gồm chữ thường, số và dấu gạch ngang.";
  if (!form.categoryId) return "Vui lòng chọn danh mục.";
  if (!/^\d+$/.test(form.price) || Number(form.price) <= 0 || !Number.isSafeInteger(Number(form.price))) {
    return "Giá bán phải là số nguyên dương hợp lệ.";
  }
  if (form.originalPrice && (!/^\d+$/.test(form.originalPrice) || !Number.isSafeInteger(Number(form.originalPrice)))) {
    return "Giá gốc phải là số nguyên hợp lệ.";
  }
  if (form.isAutoSync && (isNaN(Number(form.markupValue)) || Number(form.markupValue) < 0)) {
    return "Mức chênh lệch lãi (markup) phải là số không âm.";
  }
  if (form.thumbnailUrl && !/^https?:\/\//i.test(form.thumbnailUrl)) {
    return "Ảnh phải có đường dẫn HTTP hoặc HTTPS.";
  }
  return null;
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export default function AdminProductEditor({ initialProduct, categories }: Props) {
  const initialDraft = draftFromProduct(initialProduct);
  const [form, setForm] = useState<Draft>(initialDraft);
  const [serverForm, setServerForm] = useState<Draft>(initialDraft);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("general");
  const [previewMode, setPreviewMode] = useState<"live" | "draft">("live");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("mobile");
  const [previewType, setPreviewType] = useState<"card" | "quick">("card");
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuantity, setPreviewQuantity] = useState(1);
  const [previewInput, setPreviewInput] = useState("");
  const latestRef = useRef<Draft>(initialDraft);
  const savedRef = useRef(JSON.stringify(initialDraft));
  const attemptedRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const supplierMapping = initialProduct.supplierMapping;
  const supplierPrice = supplierMapping?.supplierPrice || 0;

  const dirty = JSON.stringify(form) !== savedRef.current;
  const patch = <K extends keyof Draft>(field: K, value: Draft[K]) => {
    setForm((previous) => {
      const next = { ...previous, [field]: value };
      latestRef.current = next;
      return next;
    });
    setSaveStatus("pending");
    setError(null);
  };

  // Handler when user switches pricing mode
  const setPricingMode = (isAuto: boolean) => {
    setForm((previous) => {
      let nextPrice = previous.price;
      if (isAuto && supplierPrice > 0) {
        const calculated = calculateRetailPreview(
          supplierPrice,
          previous.markupType,
          Number(previous.markupValue) || 0
        );
        nextPrice = String(calculated);
      }
      const next = {
        ...previous,
        isAutoSync: isAuto,
        price: nextPrice,
      };
      latestRef.current = next;
      return next;
    });
    setSaveStatus("pending");
    setError(null);
  };

  // Handler for dynamic markup updates
  const updateMarkup = (markupType: string, markupValue: string) => {
    setForm((previous) => {
      let nextPrice = previous.price;
      if (previous.isAutoSync && supplierPrice > 0) {
        const calculated = calculateRetailPreview(
          supplierPrice,
          markupType,
          Number(markupValue) || 0
        );
        nextPrice = String(calculated);
      }
      const next = {
        ...previous,
        markupType,
        markupValue,
        price: nextPrice,
      };
      latestRef.current = next;
      return next;
    });
    setSaveStatus("pending");
    setError(null);
  };

  const save = useCallback(
    async (force = false) => {
      if (inFlightRef.current) return;
      const snapshot = latestRef.current;
      const serialized = JSON.stringify(snapshot);
      if (serialized === savedRef.current) {
        setSaveStatus("saved");
        return;
      }
      if (!force && attemptedRef.current === serialized) return;
      const issue = validationError(snapshot);
      if (issue) {
        setError(issue);
        setSaveStatus("invalid");
        return;
      }
      attemptedRef.current = serialized;
      inFlightRef.current = true;
      setSaveStatus("saving");
      setError(null);
      try {
        const response = await fetch(`/api/admin/products/${initialProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...snapshot,
            price: Number(snapshot.price),
            originalPrice: snapshot.originalPrice ? Number(snapshot.originalPrice) : null,
            isAutoSync: snapshot.isAutoSync,
            markupType: snapshot.markupType,
            markupValue: Number(snapshot.markupValue) || 0,
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Không thể lưu thay đổi.");
        }
        const confirmed: Draft = {
          ...snapshot,
          title: payload.product.title,
          slug: payload.product.slug,
          description: payload.product.description,
          price: String(payload.product.price),
          originalPrice:
            payload.product.originalPrice === null ? "" : String(payload.product.originalPrice),
          thumbnailUrl: payload.product.thumbnailUrl ?? "",
          categoryId: payload.product.categoryId,
          type: payload.product.type,
          isActive: payload.product.isActive,
          isAutoSync: payload.product.supplierMapping
            ? payload.product.supplierMapping.isAutoSync
            : snapshot.isAutoSync,
          markupType: payload.product.supplierMapping
            ? payload.product.supplierMapping.markupType
            : snapshot.markupType,
          markupValue: payload.product.supplierMapping
            ? String(payload.product.supplierMapping.markupValue)
            : snapshot.markupValue,
        };
        savedRef.current = JSON.stringify(confirmed);
        setServerForm(confirmed);

        if (JSON.stringify(latestRef.current) === serialized) {
          latestRef.current = confirmed;
          setForm(confirmed);
          setSaveStatus("saved");
        } else {
          setSaveStatus("pending");
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Không thể lưu thay đổi.");
        setSaveStatus("error");
      } finally {
        inFlightRef.current = false;
      }
    },
    [initialProduct.id]
  );

  // Autosave only valid snapshots; one request in flight at a time.
  useEffect(() => {
    const serialized = JSON.stringify(form);
    if (serialized === savedRef.current || inFlightRef.current || attemptedRef.current === serialized) {
      return;
    }
    const timer = setTimeout(() => {
      void save();
    }, 900);
    return () => clearTimeout(timer);
  }, [form, saveStatus, save]);

  useEffect(() => {
    const onOnline = () => {
      if (JSON.stringify(latestRef.current) !== savedRef.current) void save(true);
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(latestRef.current) !== savedRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [save]);

  const preview = previewMode === "live" ? serverForm : form;
  const previewPrice = Number(preview.price) || 0;
  const unSavedLabel = previewMode === "draft" && dirty;
  const field =
    "w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  const label = "mb-1.5 block text-sm font-medium text-slate-200";
  const tabs: Array<{ key: Tab; title: string }> = [
    { key: "general", title: "Thông tin chung" },
    { key: "pricing", title: "Gói & Giá" },
    { key: "supplier", title: "Nhà cung cấp" },
    { key: "settings", title: "Cấu hình bán hàng" },
  ];

  // Live calculation for dynamic preview
  const currentMarkupNum = Number(form.markupValue) || 0;
  const calculatedAutoPrice = calculateRetailPreview(supplierPrice, form.markupType, currentMarkupNum);
  const currentProfit = Number(form.price) - supplierPrice;

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            onClick={(event) => {
              if (dirty && !window.confirm("Có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?")) {
                event.preventDefault();
              }
            }}
            className="rounded-xl border border-slate-700 p-2 text-slate-200 hover:bg-slate-800"
            aria-label="Về danh sách sản phẩm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Chỉnh sửa sản phẩm</h1>
            <p className="text-xs text-slate-400">{initialProduct.title}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            role="status"
            aria-live="polite"
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
              saveStatus === "saved"
                ? "bg-emerald-500/10 text-emerald-300"
                : saveStatus === "error" || saveStatus === "invalid"
                ? "bg-rose-500/10 text-rose-300"
                : "bg-amber-500/10 text-amber-200"
            }`}
          >
            {saveStatus === "saved" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : saveStatus === "saving" ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Clock3 className="h-4 w-4" />
            )}
            {
              {
                saved: "Đã lưu",
                pending: "Chưa lưu",
                saving: "Đang lưu",
                error: "Lưu thất bại",
                invalid: "Dữ liệu chưa hợp lệ",
              }[saveStatus]
            }
          </span>
          <button
            type="button"
            onClick={() => void save(true)}
            disabled={inFlightRef.current || saveStatus === "saving" || (!dirty && saveStatus === "saved")}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Lưu thay đổi
          </button>
          <button
            type="button"
            onClick={() => setShowPreview((value) => !value)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-500/40 px-3 text-sm font-medium text-blue-300 hover:bg-blue-500/10"
          >
            <Eye className="h-4 w-4" /> Xem trước
          </button>
        </div>
      </div>

      {(error || saveStatus === "error") && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error || "Thay đổi chưa được lưu lên máy chủ."}
          </span>
          <button
            type="button"
            onClick={() => void save(true)}
            className="rounded-lg bg-rose-600 px-3 py-2 font-semibold text-white hover:bg-rose-500"
          >
            Thử lại
          </button>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Mục chỉnh sửa sản phẩm"
        className="flex gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 p-2"
      >
        {tabs.map((item) => (
          <button
            role="tab"
            aria-selected={tab === item.key}
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
              tab === item.key ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        {tab === "general" && (
          <>
            <div>
              <label htmlFor="productTitle" className={label}>
                Tên sản phẩm
              </label>
              <input
                id="productTitle"
                className={field}
                value={form.title}
                onChange={(e) => patch("title", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="productSlug" className={label}>
                Đường dẫn (slug)
              </label>
              <input
                id="productSlug"
                className={field}
                value={form.slug}
                onChange={(e) => patch("slug", e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">Đổi slug sẽ thay đổi đường dẫn sản phẩm đang bán.</p>
            </div>
            <div>
              <label htmlFor="productCategory" className={label}>
                Danh mục
              </label>
              <select
                id="productCategory"
                className={field}
                value={form.categoryId}
                onChange={(e) => patch("categoryId", e.target.value)}
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="productPhoto" className={label}>
                URL ảnh sản phẩm
              </label>
              <input
                id="productPhoto"
                className={field}
                value={form.thumbnailUrl}
                onChange={(e) => patch("thumbnailUrl", e.target.value)}
                onBlur={() => {
                  const normalized = normalizeThumbnailUrl(form.thumbnailUrl);
                  if (normalized && normalized !== form.thumbnailUrl) {
                    patch("thumbnailUrl", normalized);
                  }
                }}
                placeholder="https://..."
              />
              <p className="mt-1 text-xs text-slate-400">
                Dán link ảnh trực tiếp (jpg, png, webp, svg) hoặc link chia sẻ Google Drive (hệ thống tự chuyển thành CDN tốc độ cao).
              </p>
            </div>
            <div>
              <label htmlFor="productDescription" className={label}>
                Mô tả sản phẩm
              </label>
              <textarea
                id="productDescription"
                rows={6}
                className={field}
                value={form.description}
                onChange={(e) => patch("description", e.target.value)}
              />
            </div>
          </>
        )}

        {tab === "pricing" && (
          <div className="space-y-6">
            {supplierMapping ? (
              <>
                {/* Unified Pricing Mode Selector */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Cơ chế định giá bán sản phẩm
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Mode 1: Fixed Price (Locked) */}
                    <button
                      type="button"
                      onClick={() => setPricingMode(false)}
                      className={`relative flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                        !form.isAutoSync
                          ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className={`h-4 w-4 ${!form.isAutoSync ? "text-emerald-400" : "text-slate-400"}`} />
                          <span className={`text-sm font-semibold ${!form.isAutoSync ? "text-emerald-300" : "text-white"}`}>
                            Giá bán cố định (Khóa giá)
                          </span>
                        </div>
                        {!form.isAutoSync && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                            Đang chọn
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                        Tự nhập giá bán lẻ cố định (VD: 59.999đ). Tiến trình đồng bộ API sẽ <strong>không tự ý đè giá</strong> của bạn.
                      </p>
                    </button>

                    {/* Mode 2: Dynamic Markup Auto-Sync */}
                    <button
                      type="button"
                      onClick={() => setPricingMode(true)}
                      className={`relative flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                        form.isAutoSync
                          ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className={`h-4 w-4 ${form.isAutoSync ? "text-blue-400" : "text-slate-400"}`} />
                          <span className={`text-sm font-semibold ${form.isAutoSync ? "text-blue-300" : "text-white"}`}>
                            Tự động theo nguồn ({supplierMapping.supplierName})
                          </span>
                        </div>
                        {form.isAutoSync && (
                          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-300">
                            Đang chọn
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                        Giá bán tự động cập nhật theo công thức: <code>Giá nhập + % Lãi</code> mỗi khi nhà cung cấp đổi giá.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Dynamic Configuration Panel based on selected Mode */}
                {!form.isAutoSync ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Chế độ Khóa Giá Bán Cố Định đang kích hoạt</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="productPrice" className={label}>
                          Giá bán thực tế (VND)
                        </label>
                        <input
                          id="productPrice"
                          className={field}
                          inputMode="numeric"
                          value={form.price}
                          onChange={(e) => patch("price", e.target.value)}
                          placeholder="Ví dụ: 59999"
                        />
                      </div>
                      <div>
                        <label htmlFor="productOriginalPrice" className={label}>
                          Giá gốc so sánh (VND, gạch ngang)
                        </label>
                        <input
                          id="productOriginalPrice"
                          className={field}
                          inputMode="numeric"
                          value={form.originalPrice}
                          onChange={(e) => patch("originalPrice", e.target.value)}
                          placeholder="Ví dụ: 150000"
                        />
                      </div>
                    </div>

                    {supplierPrice > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900/80 px-3.5 py-2.5 text-xs border border-slate-800">
                        <span className="text-slate-400">
                          Giá vốn nhập từ <strong>{supplierMapping.supplierName}</strong>:{" "}
                          <span className="text-white font-medium">{formatMoney(supplierPrice)}</span>
                        </span>
                        <span className="flex items-center gap-1 font-semibold">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-slate-400">Lợi nhuận gộp ước tính:</span>{" "}
                          <span className={currentProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {currentProfit >= 0 ? `+${formatMoney(currentProfit)}` : formatMoney(currentProfit)} / đơn
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                      <Zap className="h-4 w-4" />
                      <span>Cấu hình tự động tính giá theo nguồn hàng</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="markupType" className={label}>
                          Hình thức cộng lãi
                        </label>
                        <select
                          id="markupType"
                          className={field}
                          value={form.markupType}
                          onChange={(e) => updateMarkup(e.target.value, form.markupValue)}
                        >
                          <option value="PERCENTAGE">Theo phần trăm (%)</option>
                          <option value="FIXED_AMOUNT">Số tiền cố định (VND)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="markupValue" className={label}>
                          Mức chênh lệch {form.markupType === "PERCENTAGE" ? "(%)" : "(VND)"}
                        </label>
                        <input
                          id="markupValue"
                          className={field}
                          inputMode="numeric"
                          value={form.markupValue}
                          onChange={(e) => updateMarkup(form.markupType, e.target.value)}
                          placeholder={form.markupType === "PERCENTAGE" ? "Ví dụ: 40" : "Ví dụ: 15000"}
                        />
                      </div>
                    </div>

                    {/* Live Calculation Preview */}
                    <div className="rounded-lg bg-slate-900/90 p-3.5 text-xs border border-blue-500/30 space-y-2">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Giá nhập gốc ({supplierMapping.supplierName}):</span>
                        <strong className="text-white">{formatMoney(supplierPrice)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>
                          Mức cộng lãi ({form.markupType === "PERCENTAGE" ? `${form.markupValue}%` : formatMoney(Number(form.markupValue) || 0)}):
                        </span>
                        <strong className="text-emerald-400">
                          +{formatMoney(Math.max(0, calculatedAutoPrice - supplierPrice))}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-sm">
                        <span className="font-semibold text-white">Giá bán tự động niêm yết:</span>
                        <span className="text-base font-bold text-blue-400">{formatMoney(calculatedAutoPrice)}</span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="productOriginalPrice" className={label}>
                        Giá gốc so sánh (VND, gạch ngang)
                      </label>
                      <input
                        id="productOriginalPrice"
                        className={field}
                        inputMode="numeric"
                        value={form.originalPrice}
                        onChange={(e) => patch("originalPrice", e.target.value)}
                        placeholder="Ví dụ: 150000"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Internal Inventory without Supplier Mapping */
              <div className="space-y-4">
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Sản phẩm kho nội bộ</h4>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      Sản phẩm này sử dụng kho Key / tài khoản nội bộ và không liên kết với API sàn dropship. Giá bán luôn cố định theo số tiền bạn đặt.
                    </p>
                  </div>
                </div>
                <div>
                  <label htmlFor="productPrice" className={label}>
                    Giá bán (VND)
                  </label>
                  <input
                    id="productPrice"
                    className={field}
                    inputMode="numeric"
                    value={form.price}
                    onChange={(e) => patch("price", e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="productOriginalPrice" className={label}>
                    Giá gốc so sánh (VND, có thể bỏ trống)
                  </label>
                  <input
                    id="productOriginalPrice"
                    className={field}
                    inputMode="numeric"
                    value={form.originalPrice}
                    onChange={(e) => patch("originalPrice", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "supplier" && (
          <>
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <h2 className="font-semibold text-white">Cấu hình nhà cung cấp API</h2>
              <p className="mt-2 text-sm text-slate-300">
                Sản phẩm hiện sử dụng cơ chế{" "}
                <strong>{initialProduct.fulfillmentType === "API_DROPSHIP" ? "API nhà cung cấp" : "Kho nội bộ"}</strong>.
                Liên kết và đồng bộ nguồn hàng được quản lý ở trang Nhà cung cấp riêng.
              </p>
              <Link
                className="mt-3 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                href="/admin/suppliers"
              >
                Mở quản lý nhà cung cấp
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              Bạn có thể điều chỉnh trực tiếp cơ chế tính giá tự động hoặc khóa giá cố định ngay tại tab &quot;Gói &amp; Giá&quot;.
            </p>
          </>
        )}

        {tab === "settings" && (
          <>
            <div>
              <label htmlFor="productType" className={label}>
                Loại sản phẩm
              </label>
              <select
                id="productType"
                className={field}
                value={form.type}
                onChange={(e) => patch("type", e.target.value)}
              >
                <option value="LICENSE_KEY">Key bản quyền</option>
                <option value="ACCOUNT">Tài khoản</option>
                <option value="COURSE_LINK">Đường dẫn / khóa học</option>
              </select>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 p-4">
              <span>
                <strong className="block text-sm text-white">Cho phép hiển thị bán sản phẩm</strong>
                <span className="text-xs text-slate-400">Tắt để ngừng bán thủ công.</span>
              </span>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => patch("isActive", e.target.checked)}
                className="h-5 w-5 accent-blue-600"
              />
            </label>
            <p className="text-xs text-slate-400">
              Trường biểu mẫu đầu vào động và cấu hình gói phức tạp cần tích hợp thêm vào backend, không được mô phỏng là đã hoạt động.
            </p>
          </>
        )}
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Save className="h-4 w-4" />
        Thay đổi hợp lệ tự lưu sau khi ngừng nhập ngắn; chỉ áp dụng khi máy chủ xác nhận.
      </p>

      {showPreview && (
        <div className="space-y-4 rounded-2xl border border-blue-500/30 bg-slate-900 p-4 sm:p-6" aria-label="Bản xem trước sản phẩm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-white">Xem trước cho khách hàng</h2>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="text-sm text-slate-400 hover:text-white"
            >
              Đóng
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["live", "draft"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPreviewMode(value)}
                className={`rounded-lg px-3 py-2 text-xs ${
                  previewMode === value ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                {value === "live" ? "Đang bán" : "Đang chỉnh sửa"}
              </button>
            ))}
            {(["desktop", "mobile"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPreviewDevice(value)}
                className={`rounded-lg px-3 py-2 text-xs ${
                  previewDevice === value ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                {value === "desktop" ? "Desktop" : "Mobile"}
              </button>
            ))}
            {(["card", "quick"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPreviewType(value)}
                className={`rounded-lg px-3 py-2 text-xs ${
                  previewType === value ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                {value === "card" ? "Thẻ sản phẩm" : "Quick View"}
              </button>
            ))}
          </div>
          {unSavedLabel && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              Đang xem dữ liệu chưa lưu. Khách vẫn thấy bản “Đang bán”.
            </p>
          )}
          <div
            className={`mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg ${
              previewDevice === "mobile" ? "max-w-[340px]" : "max-w-[760px]"
            }`}
          >
            <div className="flex h-36 items-center justify-center bg-blue-50">
              {preview.thumbnailUrl ? (
                <img src={normalizeThumbnailUrl(preview.thumbnailUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                <Package className="h-10 w-10 text-blue-500" />
              )}
            </div>
            <div className="space-y-3 p-4">
              <p className="text-xs font-medium text-blue-700">
                {categories.find((category) => category.id === preview.categoryId)?.name || "Sản phẩm số"}
              </p>
              <h3 className="text-lg font-bold">{preview.title || "Tên sản phẩm"}</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{preview.description || "Mô tả sản phẩm"}</p>
              <p className="text-xl font-bold text-blue-600">{formatMoney(previewPrice)}</p>
              {previewType === "quick" && (
                <div className="space-y-3 border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="previewQuantity" className="text-sm">
                      Số lượng thử
                    </label>
                    <input
                      id="previewQuantity"
                      type="number"
                      min={1}
                      max={100}
                      value={previewQuantity}
                      onChange={(e) => setPreviewQuantity(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right"
                    />
                  </div>
                  <label htmlFor="previewInput" className="block text-sm">
                    Thông tin thử (không gửi đi)
                  </label>
                  <input
                    id="previewInput"
                    value={previewInput}
                    onChange={(e) => setPreviewInput(e.target.value)}
                    placeholder="Nhập dữ liệu minh họa"
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                  />
                  <p className="text-right text-sm font-semibold">Tạm tính: {formatMoney(previewPrice * previewQuantity)}</p>
                </div>
              )}
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white opacity-70"
              >
                Chế độ xem trước — không tạo đơn
              </button>
            </div>
          </div>
          <p className="flex items-start gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Mô phỏng chỉ dựa vào trường hiện có trong dữ liệu sản phẩm. Chưa thử nghiệm các trường đầu vào API động hoặc luồng thanh toán.
          </p>
        </div>
      )}
    </section>
  );
}
