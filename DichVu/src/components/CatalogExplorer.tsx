"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  PackageX,
  LayoutGrid,
  ArrowUp,
} from "lucide-react";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";
import GroupedProductCard from "@/components/GroupedProductCard";
import { processSectionProducts, isApiProduct } from "@/lib/catalog-grouping";
import QuickViewModal from "@/components/QuickViewModal";
import BrandLogo from "@/components/BrandLogo";
import type { CategoryWithProducts } from "@/services/catalog.service";
import type { Category } from "@prisma/client";

interface CatalogExplorerProps {
  categories: CategoryWithProducts[];
  allCategories: Category[];
  initialCategory?: string;
  initialSearch?: string;
}

type SectionIconComponent = React.ComponentType<{ className?: string; size?: number }>;

// Authentic official vector brand / industry icons for each catalog section
const CursorSectionIcon: SectionIconComponent = ({ className = "h-4 w-4" }) => (
  <BrandLogo brandName="cursor" className={className} size={18} />
);

const OpenAiSectionIcon: SectionIconComponent = ({ className = "h-4 w-4" }) => (
  <BrandLogo brandName="openai" className={className} size={18} />
);

const CapCutSectionIcon: SectionIconComponent = ({ className = "h-4 w-4" }) => (
  <BrandLogo brandName="capcut" className={className} size={18} />
);

const TikTokSectionIcon: SectionIconComponent = ({ className = "h-4 w-4" }) => (
  <BrandLogo brandName="tiktok" className={className} size={18} />
);

const ServerRackSectionIcon: SectionIconComponent = ({ className = "h-4 w-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="2.5" />
    <line x1="6" y1="18" x2="6.01" y2="18" strokeWidth="2.5" />
    <line x1="10" y1="6" x2="18" y2="6" />
    <line x1="10" y1="18" x2="18" y2="18" />
  </svg>
);

const UtilitiesSectionIcon: SectionIconComponent = ({ className = "h-4 w-4" }) => (
  <LayoutGrid className={className} />
);

interface SectionDefinition {
  id: string;
  title: string;
  shortLabel: string;
  icon: SectionIconComponent;
  iconBg: string;
  iconColor: string;
  activeRing: string;
  categorySlugs: string[];
  keywords: string[];
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: "ai-api",
    title: "Key & API Trí Tuệ Nhân Tạo (Cursor, Claude, Gemini, DeepSeek...)",
    shortLabel: "API AI",
    icon: CursorSectionIcon,
    iconBg: "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80",
    iconColor: "text-zinc-900 dark:text-zinc-100",
    activeRing: "ring-zinc-500/30",
    categorySlugs: [
      "ai-api",
      "ai-api-keys",
    ],
    keywords: [
      "api cursor",
      "api claude",
      "api gemini",
      "api deepseek",
      "api grok",
      "api kimi",
      "api codex",
      "codex",
      "api glm",
      "api zhipu",
      "api kiro",
    ],
  },
  {
    id: "tai-khoan-ai",
    title: "Tài Khoản AI & Trí Tuệ Nhân Tạo (ChatGPT, Gemini Pro...)",
    shortLabel: "Tài khoản AI",
    icon: OpenAiSectionIcon,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    activeRing: "ring-emerald-500/30",
    categorySlugs: [
      "ai-tool",
      "ai-cong-nghe",
      "tai-khoan-ai",
    ],
    keywords: [
      "chatgpt",
      "gpt-4",
      "gemini pro",
      "gemini advanced",
      "claude pro",
      "midjourney",
      "poe",
      "suno",
      "runway",
      "copilot pro",
    ],
  },
  {
    id: "ban-quyen",
    title: "Phần Mềm & Bản Quyền Ứng Dụng (CapCut, Canva, Office...)",
    shortLabel: "Bản quyền",
    icon: CapCutSectionIcon,
    iconBg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    activeRing: "ring-amber-500/30",
    categorySlugs: [
      "software",
      "hoc-tap-phan-mem",
      "phan-mem-ban-quyen",
      "giai-tri",
      "ban-quyen",
    ],
    keywords: [
      "capcut",
      "canva",
      "office",
      "windows",
      "adobe",
      "duolingo",
      "vpn",
      "nordvpn",
      "netflix",
      "spotify",
      "youtube",
      "elsa",
      "khóa học",
    ],
  },
  {
    id: "mxh",
    title: "Dịch Vụ Tương Tác Mạng Xã Hội (TikTok, Facebook...)",
    shortLabel: "Mạng xã hội",
    icon: TikTokSectionIcon,
    iconBg: "bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50",
    iconColor: "text-rose-600 dark:text-rose-400",
    activeRing: "ring-rose-500/30",
    categorySlugs: [
      "dich-vu-mxh",
      "mang-xa-hoi",
      "mxh",
    ],
    keywords: [
      "tiktok",
      "douyin",
      "facebook",
      "fb",
      "instagram",
      "ig",
      "youtube",
      "follower",
      "follow",
      "tăng tim",
      "like",
      "view",
      "buff",
      "sub",
    ],
  },
  {
    id: "cloud-vps",
    title: "Hạ Tầng Cloud & VPS",
    shortLabel: "Cloud VPS",
    icon: ServerRackSectionIcon,
    iconBg: "bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-900/50",
    iconColor: "text-sky-600 dark:text-sky-400",
    activeRing: "ring-sky-500/30",
    categorySlugs: [
      "cloud-vps",
      "may-chu",
      "hosting",
      "cloud",
    ],
    keywords: [
      "vps",
      "server",
      "aws",
      "azure",
      "onedrive",
      "hosting",
      "domain",
      "máy chủ",
    ],
  },
  {
    id: "khac",
    title: "Dịch Vụ & Tiện Ích Khác",
    shortLabel: "Khác",
    icon: UtilitiesSectionIcon,
    iconBg: "bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/50",
    iconColor: "text-slate-600 dark:text-slate-400",
    activeRing: "ring-slate-500/30",
    categorySlugs: [],
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
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>(
    initialCategory && initialCategory !== "all" ? initialCategory.toLowerCase() : "all"
  );
  const [activeSectionId, setActiveSectionId] = useState<string>(
    initialCategory && initialCategory !== "all" ? initialCategory.toLowerCase() : SECTION_DEFINITIONS[0].id
  );
  const [quickViewProduct, setQuickViewProduct] = useState<ProductCardProps["product"] | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState<boolean>(false);
  const [selectedSubBrands, setSelectedSubBrands] = useState<Record<string, string>>({});

  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync state if searchParams change externally (e.g. from Navbar search or category links)
  useEffect(() => {
    const urlCategory = searchParams.get("category");
    if (urlCategory) {
      const lowerCat = urlCategory.toLowerCase();
      setSelectedCategoryTab(lowerCat);
      setActiveSectionId(lowerCat);
    }

    const urlSearch = searchParams.get("search");
    if (urlSearch !== null && urlSearch !== undefined) {
      setSearchQuery(urlSearch);
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
      const catSlug = product.category?.slug.toLowerCase() || "";
      const catName = product.category?.name.toLowerCase() || "";

      let assignedSectionId = "khac";

      // 1. Primary: match by product category slug from DB
      for (const section of SECTION_DEFINITIONS) {
        if (section.id === "khac") continue;
        if (section.categorySlugs.includes(catSlug)) {
          assignedSectionId = section.id;
          break;
        }
      }

      // 2. Secondary fallback: match keywords in title or category name if not classified by slug
      if (assignedSectionId === "khac") {
        for (const section of SECTION_DEFINITIONS) {
          if (section.id === "khac") continue;
          const matches = section.keywords.some(
            (kw) =>
              titleLower.includes(kw) ||
              catName.includes(kw)
          );
          if (matches) {
            assignedSectionId = section.id;
            break;
          }
        }
      }

      // 3. Special fallback: if product type is LICENSE_KEY, group into ban-quyen if not already classified
      if (assignedSectionId === "khac" && product.type === "LICENSE_KEY") {
        assignedSectionId = "ban-quyen";
      }

      // 4. Strict safety overrides:
      // A. CapCut and Meitu are editing software, always place in ban-quyen
      if (titleLower.includes("capcut") || titleLower.includes("meitu")) {
        assignedSectionId = "ban-quyen";
      }

      // B. If a product ended up in ai-api but is not an API product (e.g. Gemini 18 Tháng, ChatGPT Plus account), route to tai-khoan-ai
      if (assignedSectionId === "ai-api" && !isApiProduct(product)) {
        assignedSectionId = "tai-khoan-ai";
      }

      map.get(assignedSectionId)?.push(product);
    });

    // 3. Return only sections that have at least 1 product
    return SECTION_DEFINITIONS.map((def) => ({
      ...def,
      products: map.get(def.id) || [],
    })).filter((sec) => sec.products.length > 0);
  }, [allProducts, searchQuery]);

  const isManualScrollingRef = useRef(false);
  const manualScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scrollspy effect: track which section is currently at the top of the viewport
  useEffect(() => {
    if (populatedSections.length === 0) return;

    const handleScroll = () => {
      if (isManualScrollingRef.current) return;

      // If user is filtering by a specific category, keep that category active
      if (selectedCategoryTab !== "all") {
        return;
      }

      // If scrolled to the very bottom of the document, activate the last section
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60) {
        setActiveSectionId(populatedSections[populatedSections.length - 1].id);
        return;
      }

      const headerOffset = 130; // navbar height + viewing margin

      for (let i = 0; i < populatedSections.length; i++) {
        const sec = populatedSections[i];
        const el = document.getElementById(`section-${sec.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Active when section top is at or above the viewing line and bottom is still below the viewing line
          if (rect.top <= headerOffset + 60 && rect.bottom > headerOffset) {
            setActiveSectionId(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    };
  }, [populatedSections, selectedCategoryTab]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      isManualScrollingRef.current = true;
      setActiveSectionId(sectionId);

      if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
      manualScrollTimerRef.current = setTimeout(() => {
        isManualScrollingRef.current = false;
      }, 700);

      const yOffset = -90; // offset for sticky navbar
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  const handleSelectCategoryTab = (tabId: string) => {
    setSelectedCategoryTab(tabId);
    if (tabId === "all") {
      setActiveSectionId(populatedSections[0]?.id || SECTION_DEFINITIONS[0].id);
      router.replace("/#catalog", { scroll: false });
    } else {
      setActiveSectionId(tabId);
      router.replace(`/?category=${tabId}#catalog`, { scroll: false });
    }
  };

  const handlePillClick = (sectionId: string) => {
    setActiveSectionId(sectionId);
    if (selectedCategoryTab !== "all" && selectedCategoryTab !== sectionId) {
      handleSelectCategoryTab(sectionId);
    } else {
      scrollToSection(sectionId);
    }
  };

  const sectionProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    populatedSections.forEach((s) => {
      counts[s.id] = s.products.length;
    });
    return counts;
  }, [populatedSections]);

  const sectionsToDisplay = useMemo(() => {
    if (selectedCategoryTab === "all") return populatedSections;
    const target = selectedCategoryTab.toLowerCase();
    const matchedDef = SECTION_DEFINITIONS.find(
      (d) =>
        d.id === target ||
        d.categorySlugs.includes(target) ||
        d.keywords.some((kw) => kw === target || target.includes(kw))
    );
    if (!matchedDef) return populatedSections;
    return populatedSections.filter((s) => s.id === matchedDef.id);
  }, [selectedCategoryTab, populatedSections]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategoryTab("all");
    setActiveSectionId(populatedSections[0]?.id || SECTION_DEFINITIONS[0].id);
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

      {/* Category Tabs Filter Bar (Universal across Mobile & Desktop) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => handleSelectCategoryTab("all")}
          className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 sm:px-3.5 py-2 text-xs font-semibold transition-all ${
            selectedCategoryTab === "all"
              ? "bg-blue-600 text-white shadow-xs ring-1 ring-blue-500"
              : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Tất cả</span>
          <span className="ml-0.5 rounded-full bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-600 dark:text-slate-300">
            {allProducts.length}
          </span>
        </button>

        {SECTION_DEFINITIONS.map((def) => {
          const isSelected =
            selectedCategoryTab === def.id ||
            def.categorySlugs.includes(selectedCategoryTab);
          const DefIcon = def.icon;
          const count = sectionProductCounts[def.id] || 0;
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => handleSelectCategoryTab(def.id)}
              className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 sm:px-3.5 py-2 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-blue-600 text-white shadow-xs ring-1 ring-blue-500"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <DefIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{def.shortLabel}</span>
              {count > 0 && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected
                      ? "bg-blue-700 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Container: Category Sections spanning full width */}
      {sectionsToDisplay.length > 0 ? (
        <div className="relative w-full">
          {/* Category Sections */}
          <div className="w-full space-y-10 sm:space-y-14">
            {sectionsToDisplay.map((sec) => {
              const currentSubBrand = selectedSubBrands[sec.id] || "all";
              const { items, availableBrands } = processSectionProducts(
                sec.products,
                currentSubBrand
              );

              return (
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

                  {/* Sub-Brand Filter Tabs (e.g. Claude, Cursor, DeepSeek, Gemini...) */}
                  {availableBrands.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSubBrands((prev) => ({ ...prev, [sec.id]: "all" }))
                        }
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0 transition-all ${
                          currentSubBrand === "all"
                            ? "bg-blue-600 text-white shadow-xs ring-1 ring-blue-500"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        Tất cả ({sec.products.length})
                      </button>
                      {availableBrands.map((b) => {
                        const isSelected = currentSubBrand === b.key;
                        return (
                          <button
                            key={b.key}
                            type="button"
                            onClick={() =>
                              setSelectedSubBrands((prev) => ({
                                ...prev,
                                [sec.id]: b.key,
                              }))
                            }
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0 transition-all ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-xs ring-1 ring-blue-500"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                          >
                            <span>{b.name}</span>
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                                isSelected
                                  ? "bg-blue-700 text-white"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {b.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Dense Product Grid: Grouped Service Cards or Single Products */}
                  <div className="grid grid-cols-2 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5">
                    {items.map((item, idx) => {
                      if (item.type === "grouped" && item.groupedData) {
                        return (
                          <GroupedProductCard
                            key={`group-${item.groupKey}-${idx}`}
                            {...item.groupedData}
                            onQuickView={handleOpenQuickView}
                          />
                        );
                      }
                      return (
                        <ProductCard
                          key={item.singleProduct.id}
                          product={item.singleProduct}
                          onQuickView={handleOpenQuickView}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Floating Right Edge Drawer Pills (Desktop: lg:flex) */}
          {populatedSections.length > 1 && (
            <aside
              aria-label="Điều hướng nhanh danh mục"
              className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-2 select-none pointer-events-none"
            >
              {populatedSections.map((sec) => {
                const isActive =
                  selectedCategoryTab !== "all"
                    ? selectedCategoryTab === sec.id
                    : activeSectionId === sec.id;
                const SecIcon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handlePillClick(sec.id)}
                    className={`pointer-events-auto group relative flex items-center justify-end rounded-l-2xl border-y border-l transition-all duration-300 ease-out shadow-md overflow-hidden ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-500 shadow-blue-500/30 ring-2 ring-blue-400/50"
                        : "bg-white/95 dark:bg-zinc-900/95 text-zinc-700 dark:text-zinc-200 border-zinc-200/90 dark:border-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl backdrop-blur-sm"
                    }`}
                    style={{ height: "42px" }}
                    title={sec.title}
                  >
                    {/* Label that expands to the left of the icon on hover */}
                    <div className="max-w-0 opacity-0 group-hover:max-w-[220px] group-hover:opacity-100 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden flex items-center gap-2 text-xs font-semibold pl-0 group-hover:pl-3.5">
                      <span>{sec.shortLabel}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-blue-700 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {sec.products.length}
                      </span>
                    </div>

                    {/* Authentic Icon container anchored to the right edge */}
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      <SecIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
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
            {searchQuery
              ? `Không tìm thấy sản phẩm nào khớp với từ khóa "${searchQuery}".`
              : "Danh mục này hiện chưa có sản phẩm sẵn sàng. Đội ngũ kỹ thuật đang cập nhật thêm dịch vụ mới!"}
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
