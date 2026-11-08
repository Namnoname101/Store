"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  PackageX,
  LayoutGrid,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Cpu,
  Bot,
  Layers,
  Share2,
  Server,
} from "lucide-react";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";
import GroupedProductCard from "@/components/GroupedProductCard";
import { processSectionProducts, isApiProduct } from "@/lib/catalog-grouping";
import QuickViewModal from "@/components/QuickViewModal";
import BrandLogo from "@/components/BrandLogo";
import BrandFilterNavigator, { BRAND_NAVIGATOR_ITEMS } from "@/components/BrandFilterNavigator";
import type { CategoryWithProducts } from "@/services/catalog.service";
import type { Category } from "@prisma/client";

interface CatalogExplorerProps {
  categories: CategoryWithProducts[];
  allCategories: Category[];
  initialCategory?: string;
  initialSearch?: string;
}

type SectionIconComponent = React.ComponentType<{ className?: string; size?: number }>;

// Generic industry / category vector icons for each catalog section (when unfiltered)
const ApiSectionIcon: SectionIconComponent = ({ className = "h-4 w-4" }) => (
  <Cpu className={className} />
);

const AiAccountSectionIcon: SectionIconComponent = ({ className = "h-4 w-4" }) => (
  <Bot className={className} />
);

const SoftwareSectionIcon: SectionIconComponent = ({ className = "h-4 w-4" }) => (
  <Layers className={className} />
);

const SocialSectionIcon: SectionIconComponent = ({ className = "h-4 w-4" }) => (
  <Share2 className={className} />
);

const ServerRackSectionIcon: SectionIconComponent = ({ className = "h-4 w-4" }) => (
  <Server className={className} />
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
    title: "Key & API Trí Tuệ Nhân Tạo (Claude, Codex, Cursor)",
    shortLabel: "API AI",
    icon: ApiSectionIcon,
    iconBg: "bg-blue-500/10 border border-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    activeRing: "ring-blue-500/30",
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
    icon: AiAccountSectionIcon,
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
      "kling",
      "muse",
    ],
  },
  {
    id: "ban-quyen",
    title: "Phần Mềm & Bản Quyền Ứng Dụng (CapCut, Canva, Office...)",
    shortLabel: "Bản quyền",
    icon: SoftwareSectionIcon,
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
      "xingtu",
      "quizlet",
      "photoroom",
      "figma",
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
    icon: SocialSectionIcon,
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

/**
 * Strict Brand Matching: strictly checks product title, slug, and category metadata.
 * NEVER matches incidental marketing descriptions (e.g. Canva Pro mentioning "Facebook ratio",
 * CapCut mentioning "Windows/Mac", or Codex AI mentioning "Gemini 4 Argon").
 */
export function matchProductBrand(product: FlattenedProduct, brandId: string): boolean {
  if (!brandId || brandId === "all") return true;
  const titleLower = product.title.toLowerCase();
  const slugLower = (product.slug || "").toLowerCase();
  const catSlug = (product.category?.slug || "").toLowerCase();
  const catName = (product.category?.name || "").toLowerCase();

  switch (brandId) {
    case "claude":
      return titleLower.includes("claude") || slugLower.includes("claude");
    case "codex":
      return (titleLower.includes("codex") || slugLower.includes("cdx")) && !titleLower.includes("claude");
    case "chatgpt":
      return titleLower.includes("chatgpt") || titleLower.includes("openai") || titleLower.includes("gpt");
    case "cursor":
      return titleLower.includes("cursor");
    case "gemini":
      return titleLower.includes("gemini");
    case "deepseek":
      return titleLower.includes("deepseek");
    case "grok":
      return titleLower.includes("grok");
    case "capcut":
      return titleLower.includes("capcut");
    case "canva":
      return titleLower.includes("canva");
    case "figma":
      return titleLower.includes("figma") || slugLower.includes("figma");
    case "xingtu":
      return titleLower.includes("xingtu") || slugLower.includes("xingtu") || titleLower.includes("醒图");
    case "photoroom":
      return titleLower.includes("photoroom") || slugLower.includes("photoroom");
    case "quizlet":
      return titleLower.includes("quizlet") || slugLower.includes("quizlet");
    case "duolingo":
      return titleLower.includes("duolingo");
    case "meitu":
      return titleLower.includes("meitu");
    case "adobe":
      return titleLower.includes("adobe");
    case "office":
      return titleLower.includes("office") || titleLower.includes("365") || titleLower.includes("microsoft");
    case "windows":
      return (
        titleLower.includes("windows pro") ||
        titleLower.includes("key windows") ||
        titleLower.includes("win 10") ||
        titleLower.includes("win 11")
      );
    case "tiktok":
      return titleLower.includes("tiktok") || slugLower.includes("tiktok");
    case "facebook":
      return (
        (titleLower.includes("facebook") || slugLower.includes("facebook") || titleLower.includes("fb")) &&
        !titleLower.includes("canva")
      );
    case "nordvpn":
      return titleLower.includes("nordvpn") || (titleLower.includes("vpn") && !titleLower.includes("vps"));
    case "netflix":
      return titleLower.includes("netflix");
    case "youtube":
      return titleLower.includes("youtube");
    case "vps":
      return titleLower.includes("vps") || catSlug.includes("vps") || catName.includes("vps") || titleLower.includes("máy chủ");
    default:
      return titleLower.includes(brandId) || slugLower.includes(brandId);
  }
}

/**
 * Strict search matching: matches title, slug, or category name.
 * Excludes raw description to eliminate false keyword collisions.
 */
function matchSearchQuery(product: FlattenedProduct, q: string): boolean {
  if (!q) return true;
  const titleLower = product.title.toLowerCase();
  const slugLower = (product.slug || "").toLowerCase();
  const catName = (product.category?.name || "").toLowerCase();
  return titleLower.includes(q) || slugLower.includes(q) || catName.includes(q);
}

export default function CatalogExplorer({
  categories,
  allCategories,
  initialCategory = "all",
  initialSearch = "",
}: CatalogExplorerProps) {
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    initialCategory && initialCategory !== "all" ? initialCategory.toLowerCase() : "all"
  );
  const [activeSectionId, setActiveSectionId] = useState<string>(SECTION_DEFINITIONS[0].id);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductCardProps["product"] | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState<boolean>(false);
  const [selectedSubBrands, setSelectedSubBrands] = useState<Record<string, string>>({});
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<Record<string, boolean>>({});

  const toggleMobileGroup = (groupKey: string) => {
    setExpandedMobileGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync state if searchParams change externally (e.g. from Navbar search or direct links)
  useEffect(() => {
    const urlBrand = searchParams.get("brand");
    const urlCategory = searchParams.get("category");

    if (urlBrand) {
      setSelectedBrandId(urlBrand.toLowerCase());
    } else if (urlCategory) {
      setSelectedBrandId(urlCategory.toLowerCase());
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

  // Compute live product counts for each brand pill in BrandFilterNavigator
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allProducts.length };
    BRAND_NAVIGATOR_ITEMS.forEach((b) => {
      if (b.id !== "all") {
        counts[b.id] = allProducts.filter((p) => matchProductBrand(p, b.id)).length;
      }
    });
    return counts;
  }, [allProducts]);

  // Filter products strictly based on selected brand and search query
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allProducts.filter((p) => {
      if (selectedBrandId && selectedBrandId !== "all") {
        if (!matchProductBrand(p, selectedBrandId)) return false;
      }
      if (query) {
        if (!matchSearchQuery(p, query)) return false;
      }
      return true;
    });
  }, [allProducts, selectedBrandId, searchQuery]);

  // Group filtered products into sections according to definitions
  const populatedSections = useMemo(() => {
    const map = new Map<string, FlattenedProduct[]>();
    SECTION_DEFINITIONS.forEach((s) => map.set(s.id, []));

    filteredProducts.forEach((product) => {
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

      // B. If a product ended up in ai-api but is not an API product, route to tai-khoan-ai
      if (assignedSectionId === "ai-api" && !isApiProduct(product)) {
        assignedSectionId = "tai-khoan-ai";
      }

      map.get(assignedSectionId)?.push(product);
    });

    // Return only sections that have at least 1 product, sorted ascending by price
    return SECTION_DEFINITIONS.map((def) => {
      const sectionProducts = map.get(def.id) || [];
      sectionProducts.sort((a, b) => a.price - b.price);
      return {
        ...def,
        products: sectionProducts,
      };
    }).filter((sec) => sec.products.length > 0);
  }, [filteredProducts]);

  const isManualScrollingRef = useRef(false);
  const manualScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scrollspy effect: track which section is currently at the top of the viewport
  useEffect(() => {
    if (populatedSections.length === 0) return;

    const handleScroll = () => {
      if (isManualScrollingRef.current) return;

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
  }, [populatedSections]);

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

  const handlePillClick = (sectionId: string) => {
    scrollToSection(sectionId);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrandId("all");
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
            Lướt xem danh mục theo từng nhóm bên dưới hoặc chọn thương hiệu để lọc tức thì
          </p>
        </div>

        {/* Live Filter Search Input */}
        <div className="relative w-full sm:w-72 md:w-80">
          <input
            type="text"
            placeholder="Lọc tài nguyên, API, key..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-9 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          {searchQuery && (
            <button
              onClick={() => {
                handleSearchChange("");
                if (selectedBrandId === "all") {
                  router.replace("/#catalog", { scroll: false });
                }
              }}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] sm:min-h-[24px] sm:min-w-[24px] flex items-center justify-center -mr-2 -mt-2 sm:mr-0 sm:mt-0"
              aria-label="Xóa từ khóa"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Brand & Resource Quick Navigator (Unified Capsule Grid - Kiểu 1) */}
      <BrandFilterNavigator
        activeBrandId={selectedBrandId}
        activeQuery={searchQuery}
        onSelectBrand={(brandId) => {
          setSelectedBrandId(brandId);
          if (brandId === "all") {
            setSearchQuery("");
            router.replace("/#catalog", { scroll: false });
          } else {
            router.replace(`/?brand=${encodeURIComponent(brandId)}#catalog`, { scroll: false });
          }
        }}
        brandCounts={brandCounts}
        totalCount={allProducts.length}
        filteredCount={filteredProducts.length}
        className="mb-8"
      />

      {/* Main Container: Category Sections spanning full width */}
      {populatedSections.length > 0 ? (
        <div className="relative w-full">
          {/* Category Sections */}
          <div className="w-full space-y-10 sm:space-y-14">
            {populatedSections.map((sec) => {
              // 1. Probe available sub-brands across products in this section
              const { availableBrands: allAvailableBrands } = processSectionProducts(
                sec.products,
                "all"
              );

              // 2. If sub-brands exist, show sub-brand groupings
              const hasSubBrands = allAvailableBrands.length > 1;
              const defaultSubBrand = hasSubBrands ? allAvailableBrands[0].key : "all";
              const currentSubBrand =
                hasSubBrands && (!selectedSubBrands[sec.id] || selectedSubBrands[sec.id] === "all")
                  ? defaultSubBrand
                  : selectedSubBrands[sec.id] || "all";

              // 3. Process products for active sub-brand
              const { items } = processSectionProducts(
                sec.products,
                currentSubBrand
              );

              const activeBrandObj =
                selectedBrandId && selectedBrandId !== "all"
                  ? BRAND_NAVIGATOR_ITEMS.find((b) => b.id === selectedBrandId)
                  : null;

              return (
                <section
                  key={sec.id}
                  id={`section-${sec.id}`}
                  className="scroll-mt-24"
                >
                  {/* Modern Section Header */}
                  <div className="mb-4 pb-2.5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div
                        className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl shadow-2xs ${
                          activeBrandObj
                            ? "bg-primary/10 border border-primary/20 text-primary"
                            : `${sec.iconBg} ${sec.iconColor}`
                        }`}
                      >
                        {activeBrandObj ? (
                          <BrandLogo brandName={activeBrandObj.iconKey} className="h-5 w-5" size={20} />
                        ) : (
                          <sec.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {activeBrandObj ? activeBrandObj.name : sec.title}
                          </h3>
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0">
                            {hasSubBrands && !activeBrandObj
                              ? allAvailableBrands.reduce((sum, b) => sum + b.count, 0)
                              : items.length} dịch vụ
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors min-h-[44px] px-2"
                      title="Lên đầu trang"
                    >
                      <span>Lên đầu</span>
                      <ArrowUp className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Sub-Brand Sections or Standard Single Grid */}
                  {hasSubBrands ? (
                    <div className="space-y-7 sm:space-y-9">
                      {allAvailableBrands.map((b) => {
                        const { items: brandItems } = processSectionProducts(
                          sec.products,
                          b.key
                        );
                        if (brandItems.length === 0) return null;

                        const isCodex = b.key === "codex";
                        const isClaude = b.key === "claude";
                        const dotColor = isCodex
                          ? "bg-emerald-500 shadow-emerald-500/50"
                          : isClaude
                          ? "bg-amber-500 shadow-amber-500/50"
                          : "bg-blue-500 shadow-blue-500/50";
                        const badgeBorder = isCodex
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : isClaude
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400";
                        const subtitle = isCodex
                          ? "Hạn mức Credit cấp phát tự động 24/7 cho Cursor & IDE"
                          : isClaude
                          ? "API Anthropic Claude 5.5 & 5.6 (Sonnet 5.5 & Opus 5.5) chính hãng tốc độ cao"
                          : "Cấp phát tự động 24/7";

                        const groupKey = `subbrand-${b.key}`;
                        const isExpanded = !!expandedMobileGroups[groupKey];
                        const remainingCount = brandItems.length - 3;

                        return (
                          <div
                            key={b.key}
                            id={groupKey}
                            className="space-y-3"
                          >
                            {/* Sub-brand Header Bar */}
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                              <div className="flex items-center gap-2 sm:gap-2.5">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full shadow-xs ${dotColor}`}
                                />
                                <h4 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                  <span>{b.name}</span>
                                  <span
                                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeBorder}`}
                                  >
                                    {b.count} dịch vụ
                                  </span>
                                </h4>
                                <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500">
                                  • {subtitle}
                                </span>
                              </div>

                              {brandItems.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => toggleMobileGroup(groupKey)}
                                  className="md:hidden inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-500/10 px-2.5 py-1 min-h-[44px] rounded-full border border-blue-500/20 active:scale-95 transition-all"
                                >
                                  <span>{isExpanded ? "Thu gọn" : `Xem thêm (${b.count})`}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Products Grid for this Brand */}
                            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                              {brandItems.map((item, idx) => {
                                const isHiddenOnMobile = idx >= 3 && !isExpanded;
                                return (
                                  <div
                                    key={item.type === "grouped" && item.groupedData ? `group-${item.groupKey}-${idx}` : item.singleProduct.id}
                                    className={isHiddenOnMobile ? "hidden md:block" : "block"}
                                  >
                                    {item.type === "grouped" && item.groupedData ? (
                                      <GroupedProductCard
                                        {...item.groupedData}
                                        onQuickView={handleOpenQuickView}
                                      />
                                    ) : (
                                      <ProductCard
                                        product={item.singleProduct}
                                        onQuickView={handleOpenQuickView}
                                      />
                                    )}
                                  </div>
                                );
                              })}

                              {/* 4th slot on mobile: Show "Xem thêm" card if collapsed */}
                              {brandItems.length > 3 && !isExpanded && (
                                <button
                                  type="button"
                                  onClick={() => toggleMobileGroup(groupKey)}
                                  className="md:hidden flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 border-dashed border-blue-500/30 dark:border-blue-400/20 bg-gradient-to-b from-blue-50/70 to-indigo-50/70 dark:from-blue-950/20 dark:to-indigo-950/20 hover:border-blue-500 active:scale-[0.98] transition-all text-center min-h-[190px]"
                                  aria-label={`Xem thêm ${remainingCount} gói ${b.name}`}
                                >
                                  <div className="w-10 h-10 rounded-full bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                                    <ChevronDown className="w-5 h-5 animate-bounce" />
                                  </div>
                                  <span className="text-xs font-black text-slate-800 dark:text-white">
                                    +{remainingCount} gói khác
                                  </span>
                                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1 flex items-center gap-0.5">
                                    <span>Xem tất cả {b.name}</span>
                                    <span>→</span>
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* Expanded footer button on mobile */}
                            {brandItems.length > 3 && isExpanded && (
                              <div className="md:hidden pt-1 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    toggleMobileGroup(groupKey);
                                    const el = document.getElementById(groupKey);
                                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }}
                                  className="w-full py-2 px-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] transition-all"
                                >
                                  <span>Thu gọn danh sách {b.name}</span>
                                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Dense Product Grid: Grouped Service Cards or Single Products with Mobile Collapsible */
                    (() => {
                      const sectionGroupKey = `section-${sec.id}`;
                      const isSectionExpanded = !!expandedMobileGroups[sectionGroupKey];
                      const remainingSectionCount = items.length - 3;

                      return (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {items.map((item, idx) => {
                              const isHiddenOnMobile = idx >= 3 && !isSectionExpanded;
                              return (
                                <div
                                  key={item.type === "grouped" && item.groupedData ? `group-${item.groupKey}-${idx}` : item.singleProduct.id}
                                  className={isHiddenOnMobile ? "hidden md:block" : "block"}
                                >
                                  {item.type === "grouped" && item.groupedData ? (
                                    <GroupedProductCard
                                      {...item.groupedData}
                                      onQuickView={handleOpenQuickView}
                                    />
                                  ) : (
                                    <ProductCard
                                      product={item.singleProduct}
                                      onQuickView={handleOpenQuickView}
                                    />
                                  )}
                                </div>
                              );
                            })}

                            {/* 4th slot on mobile: Show "Xem thêm" card if collapsed */}
                            {items.length > 3 && !isSectionExpanded && (
                              <button
                                type="button"
                                onClick={() => toggleMobileGroup(sectionGroupKey)}
                                className="md:hidden flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 border-dashed border-blue-500/30 dark:border-blue-400/20 bg-gradient-to-b from-blue-50/70 to-indigo-50/70 dark:from-blue-950/20 dark:to-indigo-950/20 hover:border-blue-500 active:scale-[0.98] transition-all text-center min-h-[190px]"
                                aria-label={`Xem thêm ${remainingSectionCount} dịch vụ ${sec.shortLabel}`}
                              >
                                <div className="w-10 h-10 rounded-full bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                                  <ChevronDown className="w-5 h-5 animate-bounce" />
                                </div>
                                <span className="text-xs font-black text-slate-800 dark:text-white">
                                  +{remainingSectionCount} dịch vụ khác
                                </span>
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1 flex items-center gap-0.5">
                                  <span>Xem tất cả {sec.shortLabel}</span>
                                  <span>→</span>
                                </span>
                              </button>
                            )}
                          </div>

                          {/* Expanded footer button on mobile */}
                          {items.length > 3 && isSectionExpanded && (
                            <div className="md:hidden pt-1 flex justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  toggleMobileGroup(sectionGroupKey);
                                  const el = document.getElementById(`section-${sec.id}`);
                                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                className="w-full py-2 px-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] transition-all"
                              >
                                <span>Thu gọn danh sách {sec.shortLabel}</span>
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
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
                const isActive = activeSectionId === sec.id;
                const SecIcon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handlePillClick(sec.id)}
                    className={`pointer-events-auto group relative flex items-center justify-end rounded-l-2xl border-y border-l transition-all duration-300 ease-out shadow-md overflow-hidden ${
                      isActive
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-700 dark:border-zinc-300 shadow-sm"
                        : "bg-white/95 dark:bg-zinc-900/95 text-zinc-700 dark:text-zinc-200 border-zinc-200/90 dark:border-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl backdrop-blur-sm"
                    }`}
                    style={{ height: "42px" }}
                    title={sec.title}
                  >
                    {/* Label that expands to the left of the icon on hover */}
                    <div className="max-w-0 opacity-0 group-hover:max-w-[220px] group-hover:opacity-100 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden flex items-center gap-2 text-xs font-semibold pl-0 group-hover:pl-3.5">
                      <span>{sec.shortLabel}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
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
        /* Polished Accessible Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center max-w-md mx-auto my-10 shadow-xs">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-2xs">
            <PackageX className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {selectedBrandId && selectedBrandId !== "all"
              ? `Chưa có sản phẩm ${
                  BRAND_NAVIGATOR_ITEMS.find((b) => b.id === selectedBrandId)?.name || selectedBrandId
                }`
              : "Không tìm thấy sản phẩm phù hợp"}
          </h3>
          <p className="mt-2 max-w-sm text-xs text-muted-foreground leading-relaxed">
            {selectedBrandId && selectedBrandId !== "all"
              ? `Hiện tại kho hàng đang cập nhật thêm các gói dịch vụ mới cho ${
                  BRAND_NAVIGATOR_ITEMS.find((b) => b.id === selectedBrandId)?.name || selectedBrandId
                }. Bạn có thể khám phá các dịch vụ khác đang sẵn sàng bên dưới.`
              : searchQuery
              ? `Không tìm thấy sản phẩm nào khớp với từ khóa "${searchQuery}". Vui lòng thử tìm với từ khóa khác.`
              : "Danh mục này hiện chưa có sản phẩm sẵn sàng. Đội ngũ kỹ thuật đang cập nhật thêm dịch vụ mới!"}
          </p>
          <button
            onClick={clearFilters}
            className="mt-5 inline-flex items-center gap-1.5 min-h-[44px] rounded-xl bg-primary text-primary-foreground px-5 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
          >
            <span>Xem tất cả sản phẩm ({allProducts.length})</span>
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
