import type { Product } from "@prisma/client";
import type { VariantProduct, GroupedProductCardProps } from "@/components/GroupedProductCard";

export interface BrandDef {
  key: string;
  name: string;
  keywords: string[];
}

export const BRAND_DEFINITIONS: BrandDef[] = [
  { key: "claude", name: "Claude AI", keywords: ["claude"] },
  { key: "cursor", name: "Cursor AI", keywords: ["cursor"] },
  { key: "codex", name: "Codex AI", keywords: ["codex"] },
  { key: "deepseek", name: "DeepSeek", keywords: ["deepseek"] },
  { key: "gemini", name: "Gemini AI", keywords: ["gemini"] },
  { key: "grok", name: "Grok xAI", keywords: ["grok"] },
  { key: "kimi", name: "Kimi AI", keywords: ["kimi"] },
  { key: "zhipu", name: "GLM / Zhipu", keywords: ["zhipu", "glm"] },
  { key: "kiro", name: "Kiro AI", keywords: ["kiro"] },
  { key: "chatgpt", name: "ChatGPT", keywords: ["chatgpt", "gpt-4", "gpt-3", "openai"] },
  { key: "netflix", name: "Netflix", keywords: ["netflix"] },
  { key: "youtube", name: "YouTube", keywords: ["youtube"] },
  { key: "canva", name: "Canva Pro", keywords: ["canva"] },
  { key: "vps", name: "Cloud VPS", keywords: ["vps", "cloud server", "máy chủ"] },
  { key: "tiktok", name: "TikTok", keywords: ["tiktok", "douyin"] },
  { key: "facebook", name: "Facebook", keywords: ["facebook", "fb"] },
];

export function isApiProduct(product: any): boolean {
  const title = (product.title || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const catSlug = (product.category?.slug || "").toLowerCase();

  // If product is in a dedicated account/software category
  if (
    catSlug === "ai-tool" ||
    catSlug === "software" ||
    catSlug === "hoc-tap-phan-mem" ||
    catSlug === "dich-vu-mxh"
  ) {
    if (!title.startsWith("api ") && !title.includes("key api")) {
      return false;
    }
  }

  // Common duration and personal account phrases
  const hasAccountMarker =
    title.includes("18 tháng") ||
    title.includes("2 năm") ||
    title.includes("1 năm") ||
    title.includes("k12") ||
    title.includes("chính chủ") ||
    title.includes("full date") ||
    (title.includes("tài khoản") && !title.includes("api"));

  if (hasAccountMarker) {
    if (title.startsWith("api cursor") || title.includes("cursor ai api")) {
      return true;
    }
    return false;
  }

  if (
    title.startsWith("api ") ||
    title.includes("api ") ||
    title.includes("key api") ||
    title.includes("credit") ||
    title.includes("request") ||
    desc.includes("credit")
  ) {
    return true;
  }

  if (catSlug === "ai-api" || catSlug === "ai-api-keys") {
    return true;
  }

  return false;
}

export function isDisallowedShortTermApiPackage(product: {
  title?: string | null;
  description?: string | null;
  slug?: string | null;
}): boolean {
  const title = (product.title || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const slug = (product.slug || "").toLowerCase();
  const text = `${title} ${desc} ${slug}`;

  // 1. Matches short day durations (1-29 days, specifically excluding 30 days)
  if (
    /\b([1-9]|[12][0-9])\s*(ngày|ngay)\b/i.test(text) &&
    !/\b30\s*(ngày|ngay)\b/i.test(title)
  ) {
    return true;
  }

  // 2. Week durations (e.g. 1 tuần, 2 tuần)
  if (/\b\d+\s*(tuần|tuan)\b/i.test(text)) {
    return true;
  }

  // 3. Hourly limits, shifts or expiry (e.g. 12h, 24h, 19h - 23h, hạn 12h)
  if (
    /\bhạn\s*\d+h\b/i.test(text) ||
    /\b\d+h\s*-\s*\d+h/i.test(text) ||
    /\bhạn\s*\d+\s*(giờ|gio)\b/i.test(text)
  ) {
    return true;
  }

  // 4. Daily message limits & daily resets (e.g. 200 - 400 tin nhắn, reset 7h sáng/AM, credit/ngày)
  if (
    /reset\s*7h/i.test(text) ||
    /tin\s*nhắn/i.test(text) ||
    /tin\s*nhan/i.test(text) ||
    /credit\s*\/\s*(1\s*)?ng[aà]y/i.test(text)
  ) {
    return true;
  }

  // 5. Used / random / contact seller (e.g. đã dùng được, random quota, ib tele, ib zalo)
  if (
    /\b(đã dùng|da dung)\b/i.test(text) ||
    /\brandom\b/i.test(text) ||
    /\bib\s*(tele|zalo)\b/i.test(text)
  ) {
    return true;
  }

  return false;
}

export function extractVariantLabel(title: string, description: string = ""): string {
  const combined = `${title} ${description}`;

  // Match Request count first e.g. 1300 Request, 700 Request
  const reqMatch = combined.match(/([\d\.]+)\s*Request/i);
  if (reqMatch) {
    return `${reqMatch[1]} Req`;
  }

  // Match dollar credit e.g. 10$, 50$, 100$, 500$, 5000$ or $10
  const dollarMatch = combined.match(/(\d+)\s*\$|\$\s*(\d+)/i);
  if (dollarMatch) {
    const val = dollarMatch[1] || dollarMatch[2];
    const isNight =
      combined.toLowerCase().includes("21h") ||
      combined.toLowerCase().includes("đêm") ||
      combined.toLowerCase().includes("night");
    return isNight ? `Đêm $${val}` : `$${val}`;
  }

  // Match duration e.g. 1 Ngày, 30 Ngày, 1 Tuần, 1 Tháng, 1 Năm
  const durationMatch = combined.match(/(\d+)\s*(ngày|tuần|tháng|năm)/i);
  if (durationMatch) {
    const unit = durationMatch[2].charAt(0).toUpperCase() + durationMatch[2].slice(1);
    return `${durationMatch[1]} ${unit}`;
  }

  // Match message count e.g. 200 - 400 tin nhắn
  const msgMatch = combined.match(/(\d+)\s*-\s*(\d+)\s*tin\s*nhắn/i);
  if (msgMatch) {
    return `${msgMatch[2]} Msg/ngày`;
  }

  // Match SMM interaction counts e.g. 1.000 Follow
  const smmMatch = combined.match(/([\d\.]+)\s*(Follow|Like|View|Sub|Mem)/i);
  if (smmMatch) {
    return `${smmMatch[1]} ${smmMatch[2]}`;
  }

  // Fallback: clean snippet
  const clean = title.replace(/^API\s+/i, "").split(/[-–—(]/)[0].trim();
  return clean.length <= 12 ? clean : clean.slice(0, 10);
}

export interface ProcessedCatalogItem {
  type: "grouped" | "single";
  groupKey?: string;
  groupedData?: GroupedProductCardProps;
  singleProduct?: any;
}

export function processSectionProducts(
  products: any[],
  selectedBrandKey?: string
): {
  items: ProcessedCatalogItem[];
  availableBrands: { key: string; name: string; count: number }[];
} {
  // Filter out any short-term, hourly, or daily reset API packages
  const allowedProducts = products.filter((p) => !isDisallowedShortTermApiPackage(p));

  // Deduplicate products that share identical supplierProductCode or identical title & price
  const seenProducts = new Map<string, any>();
  const uniqueProducts: any[] = [];
  allowedProducts.forEach((p) => {
    const code = p.supplierMapping?.supplierProductCode;
    const key = code ? `code_${code}` : `title_${p.title}_price_${p.price}`;
    const existing = seenProducts.get(key);
    if (!existing) {
      seenProducts.set(key, p);
      uniqueProducts.push(p);
    } else {
      // Prefer the product with clearer title (e.g. containing 'Credit' or longer)
      if ((p.title || "").length > (existing.title || "").length) {
        const idx = uniqueProducts.indexOf(existing);
        if (idx !== -1) {
          uniqueProducts[idx] = p;
          seenProducts.set(key, p);
        }
      }
    }
  });

  // 1. Tag each product with brand ONLY if it is an actual API product
  const tagged = uniqueProducts.map((p) => {
    const isApi = isApiProduct(p);
    if (!isApi) {
      return {
        product: p,
        brand: null,
        variantLabel: extractVariantLabel(p.title, p.description),
      };
    }

    const titleLower = p.title.toLowerCase();
    const descLower = (p.description || "").toLowerCase();
    const slugLower = p.slug.toLowerCase();

    const matchedBrand = BRAND_DEFINITIONS.find((b) =>
      b.keywords.some(
        (kw) =>
          titleLower.includes(kw) || descLower.includes(kw) || slugLower.includes(kw)
      )
    );

    return {
      product: p,
      brand: matchedBrand || null,
      variantLabel: extractVariantLabel(p.title, p.description),
    };
  });

  // 2. Compute available brands in this section
  const brandCountMap = new Map<string, { brand: BrandDef; count: number }>();
  tagged.forEach((item) => {
    if (item.brand) {
      const existing = brandCountMap.get(item.brand.key);
      if (existing) {
        existing.count++;
      } else {
        brandCountMap.set(item.brand.key, { brand: item.brand, count: 1 });
      }
    }
  });

  const availableBrands = Array.from(brandCountMap.values())
    .filter((b) => b.count >= 1)
    .map((b) => ({
      key: b.brand.key,
      name: b.brand.name,
      count: b.count,
    }))
    .sort((a, b) => b.count - a.count);

  // 3. Filter by selected brand if user clicked a sub-brand tab
  let filtered = tagged;
  if (selectedBrandKey && selectedBrandKey !== "all") {
    filtered = tagged.filter((item) => item.brand?.key === selectedBrandKey);

    // If user explicitly filtered a specific brand (e.g. Claude), render individual cards
    const items: ProcessedCatalogItem[] = filtered.map((item) => ({
      type: "single",
      singleProduct: item.product,
    }));

    return { items, availableBrands };
  }

  // 4. Group products by brand when viewing "all"
  const brandGroups = new Map<string, typeof tagged>();
  const singles: ProcessedCatalogItem[] = [];

  tagged.forEach((item) => {
    if (!item.brand) {
      singles.push({ type: "single", singleProduct: item.product });
    } else {
      if (!brandGroups.has(item.brand.key)) {
        brandGroups.set(item.brand.key, []);
      }
      brandGroups.get(item.brand.key)!.push(item);
    }
  });

  const groupedItems: ProcessedCatalogItem[] = [];

  brandGroups.forEach((items, brandKey) => {
    if (items.length === 1) {
      // Single product, don't group
      groupedItems.push({ type: "single", singleProduct: items[0].product });
    } else {
      // Group 2+ products
      const brandDef = items[0].brand!;
      const sortedByPrice = [...items].sort(
        (a, b) => a.product.price - b.product.price
      );
      const lowestPriceVariant = sortedByPrice[0].product;

      // Ensure variant pills are unique by normalized variantLabel (keeping lowest price first)
      const variants: VariantProduct[] = [];
      const seenVariantKeys = new Set<string>();

      sortedByPrice.forEach((it) => {
        const key = it.variantLabel.toLowerCase().trim();
        if (!seenVariantKeys.has(key)) {
          seenVariantKeys.add(key);
          variants.push({
            ...it.product,
            variantLabel: it.variantLabel,
          });
        }
      });

      if (variants.length === 1) {
        groupedItems.push({ type: "single", singleProduct: variants[0] });
      } else {
        groupedItems.push({
          type: "grouped",
          groupKey: brandKey,
          groupedData: {
            groupKey: brandKey,
            brandName: brandDef.name,
            title: `Gói API / Dịch Vụ ${brandDef.name}`,
            description: lowestPriceVariant.description,
            thumbnailUrl: lowestPriceVariant.thumbnailUrl,
            category: lowestPriceVariant.category,
            variants,
          },
        });
      }
    }
  });

  // Combine grouped items and singles
  return {
    items: [...groupedItems, ...singles],
    availableBrands,
  };
}
