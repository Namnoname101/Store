import { KeyRound, UserCheck, GraduationCap, Share2 } from "lucide-react";

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export function getProductTypeInfo(
  type: string,
  context?: { categorySlug?: string; title?: string }
) {
  const cat = context?.categorySlug?.toLowerCase() || "";
  const title = context?.title?.toLowerCase() || "";

  if (
    cat === "dich-vu-mxh" ||
    cat === "mxh" ||
    cat === "tiktok" ||
    cat === "facebook" ||
    title.includes("tiktok") ||
    title.includes("facebook") ||
    title.includes("like bài viết") ||
    title.includes("tăng follower") ||
    title.includes("tăng tim")
  ) {
    return {
      label: "Dịch Vụ MXH",
      shortLabel: "Dịch vụ MXH",
      icon: Share2,
      badgeClass:
        "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20",
    };
  }

  if (title.includes("duolingo")) {
    return {
      label: "Gói Học Tập",
      shortLabel: "Học tập",
      icon: GraduationCap,
      badgeClass:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    };
  }

  switch (type) {
    case "LICENSE_KEY":
      return {
        label: "Key Bản Quyền",
        shortLabel: "Key",
        icon: KeyRound,
        badgeClass:
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      };
    case "ACCOUNT":
      return {
        label: "Tài Khoản",
        shortLabel: "Tài khoản",
        icon: UserCheck,
        badgeClass:
          "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
      };
    case "COURSE_LINK":
      return {
        label: "Khóa Học",
        shortLabel: "Khóa học",
        icon: GraduationCap,
        badgeClass:
          "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
      };
    default:
      return {
        label: "Sản Phẩm Số",
        shortLabel: "Sản phẩm",
        icon: KeyRound,
        badgeClass:
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      };
  }
}

export function getProductBadgeLabel(
  product: {
    title?: string;
    description?: string | null;
    category?: { name?: string; slug?: string } | null;
  },
  brandName?: string
): string {
  const title = (product.title || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const catSlug = (product.category?.slug || "").toLowerCase();
  const catName = product.category?.name || "";

  // Check if it's an API product
  const isApi =
    catSlug === "ai-api" ||
    catSlug === "ai-api-keys" ||
    title.startsWith("api ") ||
    title.includes("api ") ||
    title.includes("key api");

  if (isApi) {
    let cleanBrand = "";
    if (brandName) {
      cleanBrand = brandName.replace(/AI$/i, "").trim().toUpperCase();
    } else {
      if (title.includes("codex")) cleanBrand = "CODEX";
      else if (title.includes("claude")) cleanBrand = "CLAUDE";
      else if (title.includes("deepseek")) cleanBrand = "DEEPSEEK";
      else if (title.includes("cursor")) cleanBrand = "CURSOR";
      else if (title.includes("gemini")) cleanBrand = "GEMINI";
      else if (title.includes("grok")) cleanBrand = "GROK";
      else if (title.includes("glm") || title.includes("zhipu")) cleanBrand = "GLM";
      else if (title.includes("kimi")) cleanBrand = "KIMI";
      else cleanBrand = "AI";
    }

    const hasFastSpeed =
      title.includes("tốc độ") ||
      title.includes("nhanh") ||
      desc.includes("tốc độ") ||
      desc.includes("nhanh");

    if (hasFastSpeed) {
      return `API ${cleanBrand} • TỐC ĐỘ CAO`;
    }

    const isMax = title.includes("max") || desc.includes("max");
    if (isMax) {
      return `API ${cleanBrand} • MAX TỐC ĐỘ`;
    }

    return `API ${cleanBrand}`;
  }

  // Non-API products: clean up category name if it contains parentheses
  if (catName.includes("(")) {
    return catName.split("(")[0].trim().toUpperCase();
  }

  return catName.toUpperCase() || "DỊCH VỤ SỐ";
}

