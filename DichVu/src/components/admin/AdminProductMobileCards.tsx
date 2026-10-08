"use client";

import Link from "next/link";
import { Edit3, ExternalLink, KeyRound, Package, Trash2, Truck } from "lucide-react";
import type { AdminProductItem } from "@/services/admin.service";

interface AdminProductMobileCardsProps {
  products: AdminProductItem[];
  onDelete: (productId: string, title: string) => void;
}

const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export default function AdminProductMobileCards({ products, onDelete }: AdminProductMobileCardsProps) {
  return (
    <section className="grid gap-3 md:hidden" aria-label="Danh sách sản phẩm trên điện thoại">
      {products.length === 0 ? (
        <p className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-400">
          Không có sản phẩm phù hợp với bộ lọc.
        </p>
      ) : (
        products.map((product) => (
          <article key={product.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800">
                {product.thumbnailUrl ? (
                  <img src={product.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <Package className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-sm font-semibold text-white">{product.title}</h2>
                <p className="mt-0.5 break-all text-xs text-slate-400">/{product.slug}</p>
                <p className="mt-1 text-xs text-slate-300">{product.category?.name || "Chung"}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium ${product.isActive ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                {product.isActive ? "Đang bật" : "Đã tắt"}
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-800 pt-3">
              <div>
                <p className="text-xs text-slate-400">Giá bán</p>
                <p className="text-lg font-bold text-emerald-400">{money(product.price)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Tồn kho khả dụng</p>
                <p className={`text-sm font-semibold ${product.availableStock <= 5 ? "text-amber-300" : "text-emerald-300"}`}>
                  {product.availableStock} sẵn sàng
                </p>
                <p className="text-xs text-slate-500">Đã bán: {product.soldStock}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href={`/admin/products/${product.id}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-2 text-sm font-medium text-white hover:bg-indigo-500">
                <Edit3 className="h-4 w-4" aria-hidden="true" /> Chỉnh sửa
              </Link>
              <Link href={product.fulfillmentType === "API_DROPSHIP" ? "/admin/suppliers" : `/admin/inventory?productId=${product.id}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 px-2 text-sm text-slate-200 hover:bg-slate-800">
                {product.fulfillmentType === "API_DROPSHIP" ? <Truck className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                {product.fulfillmentType === "API_DROPSHIP" ? "Nhà cung cấp" : "Nhập kho"}
              </Link>
              <Link href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 px-2 text-sm text-slate-200 hover:bg-slate-800">
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Xem cửa hàng
              </Link>
              <button type="button" onClick={() => onDelete(product.id, product.title)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-900/60 px-2 text-sm text-rose-300 hover:bg-rose-950/40">
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Xóa / ẩn
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
