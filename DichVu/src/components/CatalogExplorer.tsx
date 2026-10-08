"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X, PackageX, Sparkles, Layers } from "lucide-react";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";
import QuickViewModal from "@/components/QuickViewModal";
import type { CategoryWithProducts } from "@/services/catalog.service";
import type { Category } from "@prisma/client";

interface CatalogExplorerProps {
  categories: CategoryWithProducts[];
  allCategories: Category[];
  initialCategory?: string;
  initialSearch?: string;
}

const PRESET_TABS = [
  { id: "all", label: "Tất cả" },
  {
    id: "ai-api",
    label: "AI & API",
    keywords: [
      "ai",
      "api",
      "cursor",
      "claude",
      "gemini",
      "gpt",
      "chatgpt",
      "deepseek",
      "grok",
      "kimi",
      "zhipu",
      "glm",
      "codex",
      "kiro",
      "copilot",
    ],
  },
  { id: "cloud", label: "Cloud", keywords: ["cloud", "vps", "server", "aws", "azure", "drive", "onedrive"] },
  { id: "tiktok", label: "TikTok", keywords: ["tiktok", "douyin"] },
  { id: "facebook", label: "Facebook", keywords: ["facebook", "fb"] },
  { id: "instagram", label: "Instagram", keywords: ["instagram", "ig"] },
  { id: "youtube", label: "YouTube", keywords: ["youtube", "yt"] },
  { id: "khac", label: "Khác", keywords: ["office", "windows", "key", "vpn", "canva", "netflix", "khóa học", "course"] },
];

export default function CatalogExplorer({
  categories,
  allCategories,
  initialCategory = "all",
  initialSearch = "",
}: CatalogExplorerProps) {
  const [selectedTab, setSelectedTab] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductCardProps["product"] | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync state if searchParams change externally (e.g. from Navbar search or category links)
  useEffect(() => {
    const urlCategory = searchParams.get("category");
    const urlSearch = searchParams.get("search");
    if (urlCategory) setSelectedTab(urlCategory === "ai-api-keys" ? "ai-api" : urlCategory);
    if (urlSearch !== null && urlSearch !== undefined) setSearchQuery(urlSearch);
  }, [searchParams]);

  // Flatten all products with category info
  const allProducts = useMemo(() => {
    const list: Array<
      CategoryWithProducts["products"][0] & {
        category?: { name: string; slug: string };
      }
    > = [];
    categories.forEach((cat) => {
      cat.products.forEach((prod) => {
        list.push({
          ...prod,
          category: {
            name: cat.name,
            slug: cat.slug,
          },
        });
      });
    });
    return list;
  }, [categories]);

  // Filter products by selected tab and search query
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const titleLower = product.title.toLowerCase();
      const descLower = product.description.toLowerCase();
      const catSlug = product.category?.slug.toLowerCase() || "";
      const catName = product.category?.name.toLowerCase() || "";

      // 1. Tab filter
      if (selectedTab && selectedTab !== "all") {
        const normalizedTab = selectedTab === "ai-api-keys" ? "ai-api" : selectedTab;
        const preset = PRESET_TABS.find((t) => t.id === selectedTab || t.id === normalizedTab);
        if (preset && preset.keywords) {
          const matchesKeyword = preset.keywords.some(
            (kw) =>
              titleLower.includes(kw) ||
              descLower.includes(kw) ||
              catSlug.includes(kw) ||
              catName.includes(kw)
          );
          if (!matchesKeyword) return false;
        } else {
          // Direct DB category slug match
          if (catSlug !== selectedTab.toLowerCase() && catSlug !== normalizedTab.toLowerCase()) {
            return false;
          }
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          titleLower.includes(query) ||
          descLower.includes(query) ||
          catName.includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [allProducts, selectedTab, searchQuery]);

  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId);
    const params = new URLSearchParams();
    if (tabId !== "all") params.set("category", tabId);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    const queryStr = params.toString();
    router.replace(queryStr ? `/?${queryStr}#catalog` : "/#catalog", { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSelectedTab("all");
    setSearchQuery("");
    router.replace("/#catalog", { scroll: false });
  };

  const handleOpenQuickView = (product: ProductCardProps["product"]) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  };

  return (
    <div id="catalog" className="scroll-mt-24">
      {/* Header with Search and Category Count */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Kho Dịch Vụ Số & Bản Quyền</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Khám Phá Dịch Vụ
          </h2>
        </div>

        {/* Live Filter Search Input */}
        <div className="relative w-full sm:w-72 md:w-80">
          <input
            type="text"
            placeholder="Lọc nhanh trong danh mục..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-9 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Xóa từ khóa"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs Strip */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {PRESET_TABS.map((tab) => {
          const isActive = selectedTab === tab.id;
          // Count matching products
          const count = allProducts.filter((product) => {
            if (tab.id === "all") return true;
            const titleLower = product.title.toLowerCase();
            const descLower = product.description.toLowerCase();
            const catSlug = product.category?.slug.toLowerCase() || "";
            const catName = product.category?.name.toLowerCase() || "";
            if (tab.keywords) {
              return tab.keywords.some(
                (kw) =>
                  titleLower.includes(kw) ||
                  descLower.includes(kw) ||
                  catSlug.includes(kw) ||
                  catName.includes(kw)
              );
            }
            return catSlug === tab.id;
          }).length;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 sm:px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 ring-1 ring-blue-500"
                  : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Product Grid: 4 cols Desktop, 3 Tablet, 2 Mobile */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={handleOpenQuickView}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
            <PackageX className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Không tìm thấy sản phẩm phù hợp
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Hiện không có sản phẩm nào khớp với từ khóa tìm kiếm hoặc danh mục đang chọn.
          </p>
          <button
            onClick={clearFilters}
            className="mt-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Xóa bộ lọc & Xem tất cả sản phẩm
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={isQuickViewOpen}
        product={quickViewProduct}
        onClose={handleCloseQuickView}
      />
    </div>
  );
}
