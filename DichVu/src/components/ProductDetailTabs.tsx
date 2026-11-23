"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Code2,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Terminal,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import CodexApiGuideHub from "@/components/CodexApiGuideHub";

export interface ProductDetailTabsProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    originalPrice?: number | null;
    type: string;
    category?: {
      name: string;
      slug: string;
    };
  };
  guide?: {
    title: string;
    steps?: Array<string | { text: string; image?: string; caption?: string }>;
    note?: string;
  } | null;
  isCodex?: boolean;
  isClaude?: boolean;
  isApiKeyProduct?: boolean;
  isChatGPT?: boolean;
  isChatGPTBHF?: boolean;
}

export default function ProductDetailTabs({
  product,
  guide,
  isCodex = false,
  isClaude = false,
  isApiKeyProduct = false,
  isChatGPT = false,
  isChatGPTBHF = false,
}: ProductDetailTabsProps) {
  const hasGuideSteps = Boolean(guide && guide.steps && guide.steps.length > 0);
  const [activeTab, setActiveTab] = useState<"info" | "guide" | "api">("info");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeSnippetLang, setActiveSnippetLang] = useState<"curl" | "python" | "typescript">("curl");

  const slugLower = (product.slug || "").toLowerCase();
  const titleLower = (product.title || "").toLowerCase();

  const isChatGPTFree = slugLower.includes("free") || titleLower.includes("free") || slugLower.includes("verify-phone");
  const isChatGPTBusiness = slugLower.includes("business") || titleLower.includes("business") || slugLower.includes("slot");
  const isChatGPTRealBHF = (isChatGPTBHF || slugLower.includes("bhf") || titleLower.includes("bhf")) && !isChatGPTBusiness && !isChatGPTFree;
  const isChatGPTReal24H = isChatGPT && !isChatGPTFree && !isChatGPTBusiness && !isChatGPTRealBHF;

  const isCapCut = slugLower.includes("capcut") || titleLower.includes("capcut");
  const isCapCut7D = isCapCut && (slugLower.includes("7-ngay") || titleLower.includes("7 day") || titleLower.includes("7 ngày"));

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => {
      setCopiedSnippet(null);
    }, 2000);
  };

  const defaultModel = isCodex ? "gpt-5" : "claude-sonnet-5-5";

  const codeSnippets = {
    curl: `curl https://daitruongstore.fly.dev/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-your-api-key" \\
  -d '{
    "model": "${defaultModel}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    python: `from openai import OpenAI

client = OpenAI(
    base_url="https://daitruongstore.fly.dev/v1",
    api_key="sk-your-api-key"
)

res = client.chat.completions.create(
    model="${defaultModel}",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(res.choices[0].message.content)`,
    typescript: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://daitruongstore.fly.dev/v1",
  apiKey: "sk-your-api-key",
});

const res = await client.chat.completions.create({
  model: "${defaultModel}",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(res.choices[0].message.content);`,
  };

  return (
    <div className="w-full space-y-5">
      {/* Clean Contextual Tab Bar */}
      <div
        role="tablist"
        aria-label="Thông tin sản phẩm"
        className="flex items-center gap-1.5 p-1 rounded-xl border border-border bg-secondary/40"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "info"}
          onClick={() => setActiveTab("info")}
          className={`flex-1 min-h-[40px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === "info"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4 text-primary" />
          <span>Chi tiết &amp; Lưu ý</span>
        </button>

        {hasGuideSteps && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "guide"}
            onClick={() => setActiveTab("guide")}
            className={`flex-1 min-h-[40px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "guide"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>Hướng dẫn sử dụng</span>
          </button>
        )}

        {isApiKeyProduct && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "api"}
            onClick={() => setActiveTab("api")}
            className={`flex-1 min-h-[40px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "api"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="h-4 w-4 text-primary" />
            <span>Kết nối API</span>
          </button>
        )}
      </div>

      {/* TAB 1: Chi tiết & Lưu ý */}
      {activeTab === "info" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* 1. Main Product Description (Single Clean Card) */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-sm font-bold text-foreground mb-3">
              Thông tin gói dịch vụ
            </h2>
            <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>

          {/* 2. Product-Specific Crucial Rule (Only shown if the product has strict rules) */}
          {isCapCut && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Lưu ý quan trọng khi dùng CapCut Pro ({isCapCut7D ? "7 ngày" : "30 ngày"})</span>
              </div>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Chỉ đăng nhập trên <strong>1 thiết bị duy nhất</strong>.</li>
                <li>Không bấm đăng xuất (Logout) và không xóa ứng dụng trong thời gian sử dụng.</li>
                <li>Bảo hành 1 đổi 1 suốt thời hạn nếu mất Pro khi dùng đúng quy định trên.</li>
              </ul>
            </div>
          )}

          {isChatGPT && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Quy định bảo hành gói này</span>
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {isChatGPTFree
                    ? "Bảo hành đăng nhập 24H"
                    : isChatGPTBusiness || isChatGPTRealBHF
                    ? "Bảo hành 1 đổi 1 suốt 30 ngày"
                    : "Bảo hành đăng nhập 24H (Gói tiết kiệm)"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Được đổi mới 1-1</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {isChatGPTFree
                      ? "Tài khoản sai mật khẩu hoặc chưa xác minh SĐT quốc tế trong 24h đầu."
                      : isChatGPTBusiness || isChatGPTRealBHF
                      ? "Tài khoản mất Plus / lỗi Workspace hoặc không đăng nhập được trong suốt 30 ngày."
                      : "Tài khoản sai mật khẩu hoặc chưa có Plus trong 24 giờ đầu kể từ lúc nhận."}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1.5">
                  <div className="font-bold text-destructive flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Không áp dụng bảo hành</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {isChatGPTBusiness
                      ? "Tự ý rời Workspace (Leave Workspace), đổi email hoặc can thiệp cài đặt thanh toán."
                      : "Tự ý xóa mã bảo mật 2FA, đổi email gốc, hủy gói hoặc vi phạm chính sách OpenAI."}
                  </p>
                </div>
              </div>

              {isChatGPTReal24H && (
                <p className="text-xs text-muted-foreground pt-1">
                  Cần bảo hành trọn 30 ngày? Xem{" "}
                  <Link href="/products/chatgpt-plus-1-thang-bhf" className="text-primary font-semibold hover:underline">
                    Gói ChatGPT Plus Bảo Hành Full 30 Ngày
                  </Link>
                  .
                </p>
              )}
            </div>
          )}

          {/* Shortcut button to Guide tab if guide steps exist */}
          {hasGuideSteps && (
            <div className="rounded-xl border border-border bg-secondary/30 p-4 flex items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-foreground">
                <span className="font-semibold">Lần đầu sử dụng?</span>{" "}
                <span className="text-muted-foreground">Xem hướng dẫn từng bước kèm ảnh minh họa.</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("guide")}
                className="shrink-0 rounded-lg bg-card hover:bg-secondary border border-border px-3 py-2 text-xs font-semibold text-primary transition-colors"
              >
                Mở hướng dẫn →
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Hướng dẫn sử dụng từng bước */}
      {activeTab === "guide" && hasGuideSteps && guide && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
          <h2 className="text-sm sm:text-base font-bold text-foreground">
            {guide.title}
          </h2>

          <div className="space-y-4">
            {guide.steps?.map((stepItem, idx) => {
              const isObj = typeof stepItem === "object" && stepItem !== null;
              const text = isObj ? stepItem.text : String(stepItem);
              const image = isObj ? stepItem.image : undefined;
              const caption = isObj ? stepItem.caption : undefined;

              return (
                <div key={idx} className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-mono font-bold text-xs mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="text-sm text-foreground leading-relaxed pt-0.5">
                      {text}
                    </div>
                  </div>

                  {image && (
                    <div className="ml-9">
                      <img
                        src={image}
                        alt={caption || `Bước ${idx + 1}`}
                        className="rounded-xl border border-border max-w-md w-full object-cover"
                      />
                      {caption && (
                        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {guide.note && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <strong className="font-semibold">Lưu ý: </strong>
              {guide.note}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Kết nối API (Chỉ hiển thị cho sản phẩm API Key) */}
      {activeTab === "api" && isApiKeyProduct && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Quick Endpoint Info */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Thông số kết nối nhanh (OpenAI Compatible)
              </h3>
              {isCodex && (
                <Link
                  href="/huong-dan/codex"
                  target="_blank"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <span>Tài liệu đầy đủ</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {isClaude && (
                <Link
                  href="/huong-dan/api-claude"
                  target="_blank"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <span>Hướng dẫn 5 nền tảng</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-muted-foreground block text-xs">Base URL</span>
                  <code className="font-mono text-foreground font-bold truncate block">
                    https://daitruongstore.fly.dev/v1
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("base-url", "https://daitruongstore.fly.dev/v1")}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0"
                  title="Sao chép Base URL"
                >
                  {copiedSnippet === "base-url" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <span className="text-muted-foreground block text-xs">Authorization Header</span>
                <code className="font-mono text-foreground font-bold truncate block">
                  Bearer sk-your-api-key
                </code>
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-bold text-foreground">Code mẫu gọi API</span>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary border border-border text-xs">
                {(["curl", "python", "typescript"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveSnippetLang(lang)}
                    className={`px-2.5 py-1 rounded-md font-mono font-semibold transition-all ${
                      activeSnippetLang === lang
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "curl" ? "cURL" : lang === "python" ? "Python" : "TypeScript"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
              <button
                type="button"
                onClick={() => handleCopy(`snippet-${activeSnippetLang}`, codeSnippets[activeSnippetLang])}
                className="absolute right-3 top-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs"
              >
                {copiedSnippet === `snippet-${activeSnippetLang}` ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
              <pre className="whitespace-pre overflow-x-auto leading-relaxed pt-1">
                <code>{codeSnippets[activeSnippetLang]}</code>
              </pre>
            </div>
          </div>

          {isCodex && (
            <div className="pt-1">
              <CodexApiGuideHub showKeyInput={false} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
