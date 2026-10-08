"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Eye, Package, RefreshCw, Save, ShieldCheck } from "lucide-react";

interface ProductInput {
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
}
interface CategoryOption { id: string; name: string }
interface Props { initialProduct: ProductInput; categories: CategoryOption[] }
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
}
type SaveStatus = "saved" | "pending" | "saving" | "error" | "invalid";
type Tab = "general" | "pricing" | "supplier" | "settings";

function draftFromProduct(product: ProductInput): Draft {
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
  };
}

function validationError(form: Draft): string | null {
  if (!form.title.trim()) return "Tên sản phẩm không được để trống.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) return "Slug chỉ gồm chữ thường, số và dấu gạch ngang.";
  if (!form.categoryId) return "Vui lòng chọn danh mục.";
  if (!/^\d+$/.test(form.price) || Number(form.price) <= 0 || !Number.isSafeInteger(Number(form.price))) return "Giá bán phải là số nguyên dương hợp lệ.";
  if (form.originalPrice && (!/^\d+$/.test(form.originalPrice) || !Number.isSafeInteger(Number(form.originalPrice)))) return "Giá gốc phải là số nguyên hợp lệ.";
  if (form.thumbnailUrl && !/^https?:\/\//i.test(form.thumbnailUrl)) return "Ảnh phải có đường dẫn HTTP hoặc HTTPS.";
  return null;
}
const formatMoney = (amount: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

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

  const save = useCallback(async (force = false) => {
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
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể lưu thay đổi.");
      const confirmed: Draft = {
        ...snapshot,
        title: payload.product.title,
        slug: payload.product.slug,
        description: payload.product.description,
        price: String(payload.product.price),
        originalPrice: payload.product.originalPrice === null ? "" : String(payload.product.originalPrice),
        thumbnailUrl: payload.product.thumbnailUrl ?? "",
        categoryId: payload.product.categoryId,
        type: payload.product.type,
        isActive: payload.product.isActive,
      };
      savedRef.current = JSON.stringify(confirmed);
      setServerForm(confirmed);
      setSaveStatus(JSON.stringify(latestRef.current) === savedRef.current ? "saved" : "pending");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu thay đổi.");
      setSaveStatus("error");
    } finally {
      inFlightRef.current = false;
    }
  }, [initialProduct.id]);

  // Autosave only valid snapshots; one request in flight at a time.
  useEffect(() => {
    const serialized = JSON.stringify(form);
    if (serialized === savedRef.current || inFlightRef.current || attemptedRef.current === serialized) return;
    const timer = setTimeout(() => { void save(); }, 900);
    return () => clearTimeout(timer);
  }, [form, saveStatus, save]);

  useEffect(() => {
    const onOnline = () => { if (JSON.stringify(latestRef.current) !== savedRef.current) void save(true); };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(latestRef.current) !== savedRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("beforeunload", onBeforeUnload); };
  }, [save]);

  const preview = previewMode === "live" ? serverForm : form;
  const previewPrice = Number(preview.price) || 0;
  const unSavedLabel = previewMode === "draft" && dirty;
  const field = "w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  const label = "mb-1.5 block text-sm font-medium text-slate-200";
  const tabs: Array<{ key: Tab; title: string }> = [
    { key: "general", title: "Thông tin chung" },
    { key: "pricing", title: "Gói & Giá" },
    { key: "supplier", title: "Nhà cung cấp" },
    { key: "settings", title: "Cấu hình bán hàng" },
  ];

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" onClick={(event) => { if (dirty && !window.confirm("Có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?")) event.preventDefault(); }} className="rounded-xl border border-slate-700 p-2 text-slate-200 hover:bg-slate-800" aria-label="Về danh sách sản phẩm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div><h1 className="text-xl font-bold text-white sm:text-2xl">Chỉnh sửa sản phẩm</h1><p className="text-xs text-slate-400">{initialProduct.title}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span role="status" aria-live="polite" className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${saveStatus === "saved" ? "bg-emerald-500/10 text-emerald-300" : saveStatus === "error" || saveStatus === "invalid" ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-200"}`}>
            {saveStatus === "saved" ? <CheckCircle2 className="h-4 w-4" /> : saveStatus === "saving" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
            {{ saved: "Đã lưu", pending: "Chưa lưu", saving: "Đang lưu", error: "Lưu thất bại", invalid: "Dữ liệu chưa hợp lệ" }[saveStatus]}
          </span>
          <button type="button" onClick={() => setShowPreview((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-500/40 px-3 text-sm font-medium text-blue-300 hover:bg-blue-500/10"><Eye className="h-4 w-4" /> Xem trước</button>
        </div>
      </div>

      {(error || saveStatus === "error") && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"><span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error || "Thay đổi chưa được lưu lên máy chủ."}</span><button type="button" onClick={() => void save(true)} className="rounded-lg bg-rose-600 px-3 py-2 font-semibold text-white hover:bg-rose-500">Thử lại</button></div>}
      <div role="tablist" aria-label="Mục chỉnh sửa sản phẩm" className="flex gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 p-2">
        {tabs.map((item) => <button role="tab" aria-selected={tab === item.key} key={item.key} type="button" onClick={() => setTab(item.key)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${tab === item.key ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>{item.title}</button>)}
      </div>
      <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
        {tab === "general" && <>
          <div><label htmlFor="productTitle" className={label}>Tên sản phẩm</label><input id="productTitle" className={field} value={form.title} onChange={(e) => patch("title", e.target.value)} /></div>
          <div><label htmlFor="productSlug" className={label}>Đường dẫn (slug)</label><input id="productSlug" className={field} value={form.slug} onChange={(e) => patch("slug", e.target.value)} /><p className="mt-1 text-xs text-slate-400">Đổi slug sẽ thay đổi đường dẫn sản phẩm đang bán.</p></div>
          <div><label htmlFor="productCategory" className={label}>Danh mục</label><select id="productCategory" className={field} value={form.categoryId} onChange={(e) => patch("categoryId", e.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div><label htmlFor="productPhoto" className={label}>URL ảnh sản phẩm</label><input id="productPhoto" className={field} value={form.thumbnailUrl} onChange={(e) => patch("thumbnailUrl", e.target.value)} placeholder="https://..." /></div>
          <div><label htmlFor="productDescription" className={label}>Mô tả sản phẩm</label><textarea id="productDescription" rows={6} className={field} value={form.description} onChange={(e) => patch("description", e.target.value)} /></div>
        </>}
        {tab === "pricing" && <>
          <div><label htmlFor="productPrice" className={label}>Giá bán (VND)</label><input id="productPrice" className={field} inputMode="numeric" value={form.price} onChange={(e) => patch("price", e.target.value)} /></div>
          <div><label htmlFor="productOriginalPrice" className={label}>Giá gốc để so sánh (VND, có thể bỏ trống)</label><input id="productOriginalPrice" className={field} inputMode="numeric" value={form.originalPrice} onChange={(e) => patch("originalPrice", e.target.value)} /></div>
          <p className="text-xs text-slate-400">Giá đã thanh toán của các đơn trước đó không bị cập nhật. Những sản phẩm đồng bộ giá theo API nhà cung cấp có thể bị thay đổi ở lần đồng bộ sau.</p>
        </>}
        {tab === "supplier" && <>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4"><h2 className="font-semibold text-white">Cấu hình nhà cung cấp API</h2><p className="mt-2 text-sm text-slate-300">Sản phẩm hiện sử dụng cơ chế <strong>{initialProduct.fulfillmentType === "API_DROPSHIP" ? "API nhà cung cấp" : "Kho nội bộ"}</strong>. Liên kết và đồng bộ nguồn hàng được quản lý ở trang Nhà cung cấp riêng.</p><Link className="mt-3 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" href="/admin/suppliers">Mở quản lý nhà cung cấp</Link></div>
          <p className="text-xs text-slate-400">Chưa thay đổi API hoặc ánh xạ nhà cung cấp trực tiếp tại trang này.</p>
        </>}
        {tab === "settings" && <>
          <div><label htmlFor="productType" className={label}>Loại sản phẩm</label><select id="productType" className={field} value={form.type} onChange={(e) => patch("type", e.target.value)}><option value="LICENSE_KEY">Key bản quyền</option><option value="ACCOUNT">Tài khoản</option><option value="COURSE_LINK">Đường dẫn / khóa học</option></select></div>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 p-4"><span><strong className="block text-sm text-white">Cho phép hiển thị bán sản phẩm</strong><span className="text-xs text-slate-400">Tắt để ngừng bán thủ công.</span></span><input type="checkbox" checked={form.isActive} onChange={(e) => patch("isActive", e.target.checked)} className="h-5 w-5 accent-blue-600" /></label>
          <p className="text-xs text-slate-400">Trường biểu mẫu đầu vào động và cấu hình gói phức tạp cần tích hợp thêm vào backend, không được mô phỏng là đã hoạt động.</p>
        </>}
      </div>
      <p className="flex items-center gap-2 text-xs text-slate-400"><Save className="h-4 w-4" />Thay đổi hợp lệ tự lưu sau khi ngừng nhập ngắn; chỉ áp dụng khi máy chủ xác nhận.</p>

      {showPreview && <div className="space-y-4 rounded-2xl border border-blue-500/30 bg-slate-900 p-4 sm:p-6" aria-label="Bản xem trước sản phẩm">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-white">Xem trước cho khách hàng</h2><button type="button" onClick={() => setShowPreview(false)} className="text-sm text-slate-400 hover:text-white">Đóng</button></div>
        <div className="flex flex-wrap gap-2">
          {(["live", "draft"] as const).map((value) => <button key={value} type="button" onClick={() => setPreviewMode(value)} className={`rounded-lg px-3 py-2 text-xs ${previewMode === value ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}>{value === "live" ? "Đang bán" : "Đang chỉnh sửa"}</button>)}
          {(["desktop", "mobile"] as const).map((value) => <button key={value} type="button" onClick={() => setPreviewDevice(value)} className={`rounded-lg px-3 py-2 text-xs ${previewDevice === value ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}>{value === "desktop" ? "Desktop" : "Mobile"}</button>)}
          {(["card", "quick"] as const).map((value) => <button key={value} type="button" onClick={() => setPreviewType(value)} className={`rounded-lg px-3 py-2 text-xs ${previewType === value ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}>{value === "card" ? "Thẻ sản phẩm" : "Quick View"}</button>)}
        </div>
        {unSavedLabel && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">Đang xem dữ liệu chưa lưu. Khách vẫn thấy bản “Đang bán”.</p>}
        <div className={`mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg ${previewDevice === "mobile" ? "max-w-[340px]" : "max-w-[760px]"}`}>
          <div className="flex h-36 items-center justify-center bg-blue-50">{preview.thumbnailUrl ? <img src={preview.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <Package className="h-10 w-10 text-blue-500" />}</div>
          <div className="space-y-3 p-4"><p className="text-xs font-medium text-blue-700">{categories.find((category) => category.id === preview.categoryId)?.name || "Sản phẩm số"}</p><h3 className="text-lg font-bold">{preview.title || "Tên sản phẩm"}</h3><p className="whitespace-pre-wrap text-sm text-slate-600">{preview.description || "Mô tả sản phẩm"}</p><p className="text-xl font-bold text-blue-600">{formatMoney(previewPrice)}</p>
          {previewType === "quick" && <div className="space-y-3 border-t border-slate-200 pt-3"><div className="flex items-center justify-between"><label htmlFor="previewQuantity" className="text-sm">Số lượng thử</label><input id="previewQuantity" type="number" min={1} max={100} value={previewQuantity} onChange={(e) => setPreviewQuantity(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right" /></div><label htmlFor="previewInput" className="block text-sm">Thông tin thử (không gửi đi)</label><input id="previewInput" value={previewInput} onChange={(e) => setPreviewInput(e.target.value)} placeholder="Nhập dữ liệu minh họa" className="w-full rounded-lg border border-slate-300 p-2 text-sm" /><p className="text-right text-sm font-semibold">Tạm tính: {formatMoney(previewPrice * previewQuantity)}</p></div>}
          <button type="button" disabled className="w-full cursor-not-allowed rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white opacity-70">Chế độ xem trước — không tạo đơn</button>
          </div>
        </div>
        <p className="flex items-start gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4 shrink-0" />Mô phỏng chỉ dựa vào trường hiện có trong dữ liệu sản phẩm. Chưa thử nghiệm các trường đầu vào API động hoặc luồng thanh toán.</p>
      </div>}
    </section>
  );
}
