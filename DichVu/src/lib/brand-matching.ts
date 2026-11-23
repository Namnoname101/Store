import { AI_FRONTIER_MODELS } from "@/lib/constants/ai-models";

export interface BrandFilterItem {
  id: string;
  name: string;
  query: string;
  iconKey: string;
  badge?: string;
  hoverBorder?: string;
  frontierModel?: (typeof AI_FRONTIER_MODELS)[keyof typeof AI_FRONTIER_MODELS];
}

export const BRAND_NAVIGATOR_ITEMS: BrandFilterItem[] = [
  { id: "all", name: "Tất cả", query: "", iconKey: "all" },
  { id: "claude", name: "Claude API", query: "claude", iconKey: "claude", badge: "5.5/5.6", hoverBorder: "hover:border-[#D97757]", frontierModel: AI_FRONTIER_MODELS.claude },
  { id: "chatgpt", name: "ChatGPT", query: "chatgpt", iconKey: "openai", badge: "GPT-6/o3", hoverBorder: "hover:border-accent", frontierModel: AI_FRONTIER_MODELS.openai },
  { id: "cursor", name: "Cursor AI", query: "cursor", iconKey: "cursor", badge: "PRO", hoverBorder: "hover:border-foreground/40" },
  { id: "gemini", name: "Gemini", query: "gemini", iconKey: "gemini", badge: "ARGON 4", hoverBorder: "hover:border-blue-400", frontierModel: AI_FRONTIER_MODELS.gemini },
  { id: "deepseek", name: "DeepSeek", query: "deepseek", iconKey: "deepseek", badge: "V3/R1", hoverBorder: "hover:border-indigo-400" },
  { id: "codex", name: "Codex AI", query: "codex", iconKey: "codex", badge: "CREDIT", hoverBorder: "hover:border-accent" },
  { id: "grok", name: "Grok AI", query: "grok", iconKey: "grok", badge: "xAI", hoverBorder: "hover:border-foreground/40" },
  { id: "capcut", name: "CapCut Pro", query: "capcut", iconKey: "capcut", badge: "VIP", hoverBorder: "hover:border-cyan-500" },
  { id: "canva", name: "Canva Pro", query: "canva", iconKey: "canva", badge: "PRO", hoverBorder: "hover:border-teal-500" },
  { id: "figma", name: "Figma Pro", query: "figma", iconKey: "figma", badge: "2 NĂM", hoverBorder: "hover:border-purple-400" },
  { id: "xingtu", name: "Xingtu VIP", query: "xingtu", iconKey: "xingtu", badge: "30D", hoverBorder: "hover:border-pink-500" },
  { id: "photoroom", name: "Photoroom", query: "photoroom", iconKey: "photoroom", badge: "MAX", hoverBorder: "hover:border-purple-500" },
  { id: "quizlet", name: "Quizlet Plus", query: "quizlet", iconKey: "quizlet", badge: "TEACHER", hoverBorder: "hover:border-cyan-400" },
  { id: "duolingo", name: "Duolingo", query: "duolingo", iconKey: "duolingo", badge: "SUPER", hoverBorder: "hover:border-lime-500" },
  { id: "meitu", name: "Meitu VIP", query: "meitu", iconKey: "meitu", badge: "VIP", hoverBorder: "hover:border-pink-500" },
  { id: "wink", name: "Wink VIP+", query: "wink", iconKey: "wink", badge: "7D / 90D", hoverBorder: "hover:border-pink-500" },
  { id: "adobe", name: "Adobe", query: "adobe", iconKey: "adobe", badge: "ALL/EXP", hoverBorder: "hover:border-red-500" },
  { id: "office", name: "Office 365", query: "office", iconKey: "microsoft", badge: "1 NĂM", hoverBorder: "hover:border-amber-500" },
  { id: "windows", name: "Key Windows", query: "windows", iconKey: "windows", badge: "PRO", hoverBorder: "hover:border-sky-500" },
  { id: "tiktok", name: "TikTok", query: "tiktok", iconKey: "tiktok", badge: "BUFF", hoverBorder: "hover:border-pink-500" },
  { id: "facebook", name: "Facebook", query: "facebook", iconKey: "facebook", badge: "BUFF", hoverBorder: "hover:border-blue-500" },
  { id: "vps", name: "Cloud VPS", query: "vps", iconKey: "vps", badge: "NVME", hoverBorder: "hover:border-sky-400" },
  { id: "nordvpn", name: "NordVPN", query: "nordvpn", iconKey: "nordvpn", badge: "VPN", hoverBorder: "hover:border-blue-400" },
  { id: "netflix", name: "Netflix", query: "netflix", iconKey: "netflix", badge: "4K", hoverBorder: "hover:border-rose-500" },
  { id: "youtube", name: "YouTube", query: "youtube", iconKey: "youtube", badge: "PREMIUM", hoverBorder: "hover:border-red-600" },
  { id: "suno", name: "Suno AI", query: "suno", iconKey: "suno", badge: "2500 CRE", hoverBorder: "hover:border-pink-500" },
  { id: "hma", name: "HMA VPN", query: "hma", iconKey: "hma", badge: "5 THIẾT BỊ", hoverBorder: "hover:border-sky-400" },
  { id: "kling", name: "Kling AI", query: "kling", iconKey: "kling", badge: "VIDEO AI", hoverBorder: "hover:border-amber-400" },
  { id: "muse", name: "MUSE AI", query: "muse", iconKey: "muse", badge: "31 TỶ", hoverBorder: "hover:border-purple-400" },
];

export function matchProductBrand(
  product: { title: string; slug?: string | null; category?: { name: string; slug: string } },
  brandId: string
): boolean {
  if (!brandId || brandId === "all") return true;
  const titleLower = product.title.toLowerCase();
  const slugLower = (product.slug || "").toLowerCase();

  const coreTitle = titleLower.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ").trim();

  const isChatGPT = coreTitle.includes("chatgpt") || coreTitle.includes("openai") || /\bgpt\b/.test(coreTitle);
  const isClaude = coreTitle.includes("claude") || slugLower.includes("claude");
  const isCanva = coreTitle.includes("canva") || slugLower.includes("canva");
  const isCapcut = coreTitle.includes("capcut") || slugLower.includes("capcut");

  switch (brandId) {
    case "claude":
      if (isChatGPT) return false;
      return coreTitle.includes("claude") || slugLower.includes("claude");
    case "codex":
      if (isChatGPT || isClaude) return false;
      return coreTitle.includes("codex") || slugLower.includes("cdx");
    case "chatgpt":
      return isChatGPT || titleLower.includes("chatgpt") || titleLower.includes("openai");
    case "cursor":
      if (isChatGPT || isClaude) return false;
      return coreTitle.includes("cursor") || slugLower.includes("cursor") || slugLower.startsWith("cur-");
    case "gemini":
      if (isChatGPT || isClaude) return false;
      return coreTitle.includes("gemini") || slugLower.includes("gemini") || slugLower.startsWith("gem-");
    case "deepseek":
      return coreTitle.includes("deepseek") || slugLower.includes("deepseek");
    case "grok":
      return coreTitle.includes("grok") || slugLower.includes("grok");
    case "capcut":
      return isCapcut;
    case "canva":
      return isCanva;
    case "figma":
      return coreTitle.includes("figma") || slugLower.includes("figma");
    case "xingtu":
      return coreTitle.includes("xingtu") || slugLower.includes("xingtu") || coreTitle.includes("醒图");
    case "photoroom":
      return coreTitle.includes("photoroom") || slugLower.includes("photoroom");
    case "quizlet":
      return coreTitle.includes("quizlet") || slugLower.includes("quizlet");
    case "duolingo":
      return coreTitle.includes("duolingo") || slugLower.includes("duolingo");
    case "meitu":
      return coreTitle.includes("meitu") || slugLower.includes("meitu");
    case "wink":
      return coreTitle.includes("wink") || slugLower.includes("wink");
    case "adobe":
      return coreTitle.includes("adobe") || slugLower.includes("adobe");
    case "office":
      if (/365\s*(ngày|ngay|d\b)/i.test(titleLower)) {
        return coreTitle.includes("office") || coreTitle.includes("microsoft");
      }
      return coreTitle.includes("office") || coreTitle.includes("microsoft") || /\b(365|m365|o365)\b/.test(coreTitle);
    case "windows":
      return (
        coreTitle.includes("windows pro") ||
        coreTitle.includes("key windows") ||
        coreTitle.includes("win 10") ||
        coreTitle.includes("win 11") ||
        slugLower.includes("win-") ||
        slugLower.includes("windows")
      );
    case "tiktok":
      if (isCanva || isCapcut) return false;
      return coreTitle.includes("tiktok") || slugLower.includes("tiktok");
    case "facebook":
      if (isCanva || isCapcut) return false;
      return coreTitle.includes("facebook") || slugLower.includes("facebook") || /\bfb\b/.test(coreTitle);
    case "vps":
      return coreTitle.includes("vps") || slugLower.includes("vps") || coreTitle.includes("máy chủ");
    case "nordvpn":
      return coreTitle.includes("nordvpn") || slugLower.includes("nord");
    case "netflix":
      return coreTitle.includes("netflix");
    case "spotify":
      return coreTitle.includes("spotify");
    case "youtube":
      return coreTitle.includes("youtube");
    case "suno":
      return coreTitle.includes("suno");
    case "hma":
      return coreTitle.includes("hma");
    case "kling":
      return coreTitle.includes("kling");
    case "muse":
      return coreTitle.includes("muse");
    default:
      return coreTitle.includes(brandId) || slugLower.includes(brandId);
  }
}
