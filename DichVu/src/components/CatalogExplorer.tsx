"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Sparkles, Filter, X, PackageX } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { CategoryWithProducts } from "@/services/catalog.service";
import type { Category } from "@prisma/client";

interface CatalogExplorerProps {
  categories: CategoryWithProducts[];
  allCategories: Category[];
  initialCategory?: string;
  initialSearch?: string;
}

export default function CatalogExplorer({
  categories,
  allCategories,
  initialCategory = "all",
  initialSearch = "",
}: CatalogExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const router = useRouter();

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

  // Filter products by selected category and search query
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Category filter
      if (selectedCategory && selectedCategory !== "all") {
        if (product.category?.slug !== selectedCategory) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const titleMatch = product.title.toLowerCase().includes(query);
        const descMatch = product.description.toLowerCase().includes(query);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allProducts, selectedCategory, searchQuery]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    const params = new URLSearchParams();
    if (slug !== "all") params.set("category", slug);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    const queryStr = params.toString();
    router.replace(queryStr ? `/?${queryStr}#catalog` : "/#catalog", { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    router.replace("/#catalog", { scroll: false });
  };

  return (
    <div id="catalog" className="scroll-mt-24">
      {/* Search and Filters Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Kho Sản Phẩm Số Có Sẵn</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Danh Mục Sản Phẩm
          </h2>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full sm:w-72 md:w-80">
          <input
            type="text"
            placeholder="Lọc nhanh sản phẩm..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-9 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-4">
        <button
          onClick={() => handleCategoryChange("all")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
            selectedCategory === "all"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400"
              : "border border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Tất cả</span>
          <span
            className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
              selectedCategory === "all"
                ? "bg-indigo-700/80 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {allProducts.length}
          </span>
        </button>

        {allCategories.map((category) => {
          const count = allProducts.filter(
            (p) => p.category?.slug === category.slug
          ).length;
          const isActive = selectedCategory === category.slug;

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.slug)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400"
                  : "border border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <span>{category.name}</span>
              {count > 0 && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive
                      ? "bg-indigo-700/80 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400">
            <PackageX className="h-7 w-7 text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            Không tìm thấy sản phẩm nào
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Không có sản phẩm nào khớp với từ khóa tìm kiếm hoặc danh mục đang chọn.
          </p>
          <button
            onClick={clearFilters}
            className="mt-5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Xóa bộ lọc & Xem tất cả
          </button>
        </div>
      )}
    </div>
  );
}
