"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  PackageX,
  Sparkles,
  Cloud,
  Share2,
  KeyRound,
  Layers,
  ArrowUp,
  type LucideIcon,
} from "lucide-react";
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

interface SectionDefinition {
  id: string;
  title: string;
  shortLabel: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  activeRing: string;
  keywords: string[];
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: "ai-api",
    title: "Công cụ & API Trí Tuệ Nhân Tạo",
    shortLabel: "AI & API",
    icon: Sparkles,
    iconBg: "bg-pink-50 dark:bg-pink-950/40 border border-pink-200/70 dark:border-pink-900/50",
    iconColor: "text-pink-600 dark:text-pink-400",
    activeRing: "ring-pink-500/30",
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
      "midjourney",
      "poe",
      "suno",
      "runway",
    ],
  },
  {
    id: "cloud-vps",
    title: "Hạ tầng Cloud & VPS",
    shortLabel: "Cloud VPS",
    icon: Cloud,
    iconBg: "bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-900/50",
    iconColor: "text-sky-600 dark:text-sky-400",
    activeRing: "ring-sky-500/30",
    keywords: [
      "cloud",
      "vps",
      "server",
      "aws",
      "azure",
      "drive",
      "onedrive",
      "hosting",
      "domain",
      "máy chủ",
    ],
  },
  {
    id: "mxh",
    title: "Dịch vụ Tương tác Mạng Xã Hội",
    shortLabel: "Mạng xã hội",
    icon: Share2,
    iconBg: "bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    activeRing: "ring-blue-500/30",
    keywords: [
      "tiktok",
      "douyin",
      "facebook",
      "fb",
      "instagram",
      "ig",
      "youtube",
      "yt",
      "follow",
      "like",
      "view",
      "buff",
      "sub",
      "mxh",
      "telegram",
      "x.com",
      "twitter",
    ],
  },
  {
    id: "ban-quyen",
    title: "Tài khoản & Key Bản Quyền",
    shortLabel: "Bản quyền",
    icon: KeyRound,
    iconBg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    activeRing: "ring-amber-500/30",
    keywords: [
      "office",
      "windows",
      "key",
      "vpn",
      "canva",
      "netflix",
      "adobe",
      "spotify",
      "youtube premium",
      "elsa",
      "duolingo",
      "bản quyền",
      "ban quyen",
      "khóa học",
      "course",
    ],
  },
  {
    id: "khac",
    title: "Dịch vụ & Tiện ích Khác",
    shortLabel: "Dịch vụ khác",
    icon: Layers,
    iconBg: "bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/50",
    iconColor: "text-slate-600 dark:text-slate-400",
    activeRing: "ring-slate-500/30",
    keywords: [],
  },
];

type FlattenedProduct = CategoryWithProducts["products"][0] & {
  category?: { name: string; slug: string };
};

export default function CatalogExplorer({
  categories,
  allCategories,
  initialCategory = "all",
  initialSearch = "",
}: CatalogExplorerProps) {
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [activeSectionId, setActiveSectionId] = useState<string>(SECTION_DEFINITIONS[0].id);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductCardProps["product"] | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState<boolean>(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync state if searchParams change externally (e.g. from Navbar search)
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch !== null && urlSearch !== undefined) setSearchQuery(urlSearch);

    const urlCategory = searchParams.get("category");
    if (urlCategory) {
      // Find matching section and scroll to it
      const matched = SECTION_DEFINITIONS.find(
        (s) => s.id === urlCategory || s.keywords.includes(urlCategory.toLowerCase())
      );
      if (matched) {
        setTimeout(() => {
          scrollToSection(matched.id);
        }, 150);
      }
    }
  }, [searchParams]);

  // Flatten all products with category info
  const allProducts = useMemo(() => {
    const list: FlattenedProduct[] = [];
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

  // Group products into sections according to definitions
  const populatedSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // 1. Filter by search query first if provided
    const filtered = allProducts.filter((p) => {
      if (!query) return true;
      const titleLower = p.title.toLowerCase();
      const descLower = p.description.toLowerCase();
      const catName = p.category?.name.toLowerCase() || "";
      return titleLower.includes(query) || descLower.includes(query) || catName.includes(query);
    });

    // 2. Classify each product into sections
    const map = new Map<string, FlattenedProduct[]>();
    SECTION_DEFINITIONS.forEach((s) => map.set(s.id, []));

    filtered.forEach((product) => {
      const titleLower = product.title.toLowerCase();
      const descLower = product.description.toLowerCase();
      const catSlug = product.category?.slug.toLowerCase() || "";
      const catName = product.category?.name.toLowerCase() || "";

      let assignedSectionId = "khac";

      for (const section of SECTION_DEFINITIONS) {
        if (section.id === "khac") continue;
        const matches = section.keywords.some(
          (kw) =>
            titleLower.includes(kw) ||
            descLower.includes(kw) ||
            catSlug.includes(kw) ||
            catName.includes(kw)
        );
        if (matches) {
          assignedSectionId = section.id;
          break;
        }
      }

      // Special fallback: if product type is LICENSE_KEY, group into ban-quyen if not already classified
      if (assignedSectionId === "khac" && product.type === "LICENSE_KEY") {
        assignedSectionId = "ban-quyen";
      }

      map.get(assignedSectionId)?.push(product);
    });

    // 3. Return only sections that have at least 1 product
    return SECTION_DEFINITIONS.map((def) => ({
      ...def,
      products: map.get(def.id) || [],
    })).filter((sec) => sec.products.length > 0);
  }, [allProducts, searchQuery]);

  // Scrollspy effect: track which section is currently in view
  useEffect(() => {
    if (populatedSections.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180; // offset below navbar

      for (let i = populatedSections.length - 1; i >= 0; i--) {
        const sec = populatedSections[i];
        const el = document.getElementById(`section-${sec.id}`);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSectionId(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [populatedSections]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      const yOffset = -90; // offset for sticky navbar
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSectionId(sectionId);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
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
      {/* Header with Search and Product Count */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Danh mục sản phẩm
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lướt xem danh mục theo từng nhóm bên dưới hoặc tìm kiếm nhanh
          </p>
        </div>

        {/* Live Filter Search Input */}
        <div className="relative w-full sm:w-72 md:w-80">
          <input
            type="text"
            placeholder="Lọc sản phẩm..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-9 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
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

      {/* Mobile & Tablet Quick Jump Bar (lg:hidden) */}
      {populatedSections.length > 1 && (
        <div className="lg:hidden sticky top-14 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-8 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-y border-slate-200 dark:border-slate-800 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-xs">
          {populatedSections.map((sec) => {
            const isActive = activeSectionId === sec.id;
            const SecIcon = sec.icon;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs ring-1 ring-blue-500"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <SecIcon className="h-3.5 w-3.5" />
                <span>{sec.shortLabel}</span>
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive
                      ? "bg-blue-700 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {sec.products.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Container: Category Sections spanning full width */}
      {populatedSections.length > 0 ? (
        <div className="relative w-full">
          {/* Category Sections */}
          <div className="w-full space-y-10 sm:space-y-14">
            {populatedSections.map((sec) => (
              <section
                key={sec.id}
                id={`section-${sec.id}`}
                className="scroll-mt-24"
              >
                {/* Modern Section Header */}
                <div className="mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div
                      className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl shadow-2xs ${sec.iconBg} ${sec.iconColor}`}
                    >
                      <sec.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                          {sec.title}
                        </h3>
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0">
                          {sec.products.length} dịch vụ
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors"
                    title="Lên đầu trang"
                  >
                    <span>Lên đầu</span>
                    <ArrowUp className="h-3 w-3" />
                  </button>
                </div>

                {/* Dense Product Grid: 2 cols on mobile, up to 5 cols on large desktop */}
                <div className="grid grid-cols-2 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5">
                  {sec.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onQuickView={handleOpenQuickView}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Floating Right Edge Drawer Pills (Desktop: lg:flex) */}
          {populatedSections.length > 1 && (
            <aside
              aria-label="Điều hướng nhanh danh mục"
              className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-2 select-none pointer-events-none"
            >
              {populatedSections.map((sec) => {
                const isActive = activeSectionId === sec.id;
                const SecIcon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className={`pointer-events-auto group relative flex items-center justify-end rounded-l-2xl border-y border-l transition-all duration-300 ease-out shadow-lg overflow-hidden ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-500 shadow-blue-500/30 ring-2 ring-blue-400/50"
                        : "bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl"
                    }`}
                    style={{ height: "40px" }}
                    title={sec.title}
                  >
                    {/* Hidden label that slides out to the left on hover */}
                    <div className="max-w-0 opacity-0 group-hover:max-w-[240px] group-hover:opacity-100 group-hover:pl-3.5 group-hover:pr-1 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden flex items-center gap-2 text-xs font-semibold">
                      <span>{sec.shortLabel}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                          isActive
                            ? "bg-blue-700 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {sec.products.length}
                      </span>
                    </div>

                    {/* Icon container always visible at the right edge */}
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      <SecIcon className="h-4.5 w-4.5" />
                    </div>
                  </button>
                );
              })}
            </aside>
          )}
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
            Hiện không có sản phẩm nào khớp với từ khóa tìm kiếm.
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
