"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Code2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Headphones,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Terminal,
  Cpu,
} from "lucide-react";
import CodexApiGuideHub from "@/components/CodexApiGuideHub";
import { AI_FRONTIER_MODELS, DEFAULT_CLAUDE_MODEL_ID } from "@/lib/constants/ai-models";

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
}

export default function ProductDetailTabs({
  product,
  guide,
  isCodex = false,
  isClaude = false,
  isApiKeyProduct = false,
}: ProductDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "technical">("overview");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeSnippetLang, setActiveSnippetLang] = useState<"curl" | "python" | "typescript">("curl");

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => {
      setCopiedSnippet(null);
    }, 2000);
  };

  const codeSnippets = {
    curl: `curl https://daitruongstore.fly.dev/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-your-api-key" \\
  -d '{
    "model": "claude-sonnet-5-5",
    "messages": [{"role": "user", "content": "Xin chào KhoDEE V2!"}],
    "stream": false
  }'`,
    python: `from openai import OpenAI

# Tương thích 100% OpenAI Python SDK
client = OpenAI(
    base_url="https://daitruongstore.fly.dev/v1",
    api_key="sk-your-api-key"
)

response = client.chat.completions.create(
    model="claude-sonnet-5-5",
    messages=[{"role": "user", "content": "Xin chào!"}]
)

print(response.choices[0].message.content)`,
    typescript: `import OpenAI from "openai";

// Tương thích 100% OpenAI Node/TS SDK
const client = new OpenAI({
  baseURL: "https://daitruongstore.fly.dev/v1",
  apiKey: "sk-your-api-key",
});

async function main() {
  const completion = await client.chat.completions.create({
    model: "claude-sonnet-5-5",
    messages: [{ role: "user", content: "Xin chào!" }],
  });
  console.log(completion.choices[0].message.content);
}

main();`,
  };

  return (
    <div className="w-full space-y-6">
      {/* Dual-Level Tabs Selector */}
      <div
        role="tablist"
        aria-label="Cấp độ thông tin sản phẩm"
        className="flex items-center gap-2 p-1.5 rounded-2xl border border-border bg-card shadow-xs"
      >
        <button
          type="button"
          role="tab"
          id="tab-overview"
          aria-selected={activeTab === "overview"}
          aria-controls="panel-overview"
          onClick={() => setActiveTab("overview")}
          className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "overview"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Tổng quan &amp; Người mới</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-technical"
          aria-selected={activeTab === "technical"}
          aria-controls="panel-technical"
          onClick={() => setActiveTab("technical")}
          className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "technical"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>Thông số kỹ thuật &amp; Developer</span>
          {isApiKeyProduct && (
            <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold">
              API
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Tổng quan & Người mới */}
      {activeTab === "overview" && (
        <div
          id="panel-overview"
          role="tabpanel"
          aria-labelledby="tab-overview"
          className="space-y-6 sm:space-y-8 animate-in fade-in duration-200"
        >
          {/* Product Description */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>Mô tả chi tiết sản phẩm</span>
            </h2>
            <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line font-normal">
              {product.description}
            </div>
          </div>

          {/* 3-Step Visual Onboarding Walkthrough */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Quy trình kích hoạt 3 bước đơn giản</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-secondary/40 relative">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono font-bold text-sm mb-3">
                  1
                </span>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Quét VietQR tự động 24/7
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quét mã QR qua ứng dụng ngân hàng bất kỳ. Lệnh thanh toán khớp tức thì dưới 5 giây.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary/40 relative">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-mono font-bold text-sm mb-3">
                  2
                </span>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Nhận mã &amp; Kích hoạt
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hệ thống bàn giao Key / Tài khoản kèm hướng dẫn tiếng Việt 1-Click trên màn hình đơn hàng.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary/40 relative">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground font-mono font-bold text-sm mb-3">
                  3
                </span>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Đồng hành &amp; Bảo hành 1:1
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bảo hành 1 đổi 1 trong suốt thời hạn gói. Hỗ trợ kỹ thuật viên Zalo &amp; Telegram 24/7.
                </p>
              </div>
            </div>
          </div>

          {/* 4-Pillar Transparent Warranty Card */}
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <span>4 Cam kết dịch vụ &amp; Bảo hành chuẩn mực KhoDEE</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">1-Đổi-1 trọn thời hạn gói</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mọi trục trặc kỹ thuật được xử lý đổi mới hoặc hoàn lại tương ứng mà không phụ thu.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">Bàn giao tự động 24/7</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hệ thống cấp phát tức thì qua giao diện web và email xác nhận, không cần đợi duyệt thủ công.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">Chính hãng &amp; Không phí ẩn</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Giá niêm yết là giá thanh toán cuối cùng. Không phát sinh phí duy trì hay phụ thu tài nguyên.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <Headphones className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">Kỹ thuật viên đồng hành</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Đội ngũ hỗ trợ trực tuyến qua Zalo và Telegram giải đáp nhanh mọi thắc mắc trong 15 phút.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Guide Steps (if present) */}
          {guide && guide.steps && guide.steps.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs">
              <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-accent" />
                <span>{guide.title}</span>
              </h2>

              <div className="space-y-4">
                {guide.steps.map((stepItem, idx) => {
                  const isObj = typeof stepItem === "object" && stepItem !== null;
                  const text = isObj ? stepItem.text : String(stepItem);
                  const image = isObj ? stepItem.image : undefined;
                  const caption = isObj ? stepItem.caption : undefined;

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-xs mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="text-sm text-foreground leading-relaxed pt-0.5">
                          {text}
                        </div>
                      </div>

                      {image && (
                        <div className="ml-8 mt-2">
                          <img
                            src={image}
                            alt={caption || `Bước ${idx + 1}`}
                            className="rounded-xl border border-border max-w-md w-full object-cover"
                          />
                          {caption && (
                            <p className="mt-1 text-xs text-muted-foreground italic">{caption}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {guide.note && (
                <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
                  <span className="font-bold shrink-0">Lưu ý:</span>
                  <span className="leading-relaxed">{guide.note}</span>
                </div>
              )}
            </div>
          )}

          {/* Beginner FAQs */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>Câu hỏi thường gặp</span>
            </h2>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border">
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  Sau khi thanh toán xong tôi nhận hàng ở đâu?
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Ngay khi giao dịch VietQR hoàn tất, màn hình đơn hàng sẽ tự động hiển thị thông tin tài khoản / Key bản quyền cùng nút sao chép 1-Click và file tải về `.txt`. Bạn cũng có thể tra cứu lại bất cứ lúc nào qua mục Tra cứu đơn hàng.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border">
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  Tôi có cần tài khoản đăng ký trước để mua không?
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Không cần thiết. Bạn có thể mua hàng dưới dạng khách (Guest). Hệ thống chỉ cần mã đơn hàng để bạn bảo hành và tra cứu trực tiếp 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Thông số kỹ thuật & Developer */}
      {activeTab === "technical" && (
        <div
          id="panel-technical"
          role="tabpanel"
          aria-labelledby="tab-technical"
          className="space-y-6 sm:space-y-8 animate-in fade-in duration-200"
        >
          {/* ModelAPI Gateway Architecture Overview */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span>ModelAPI Gateway Architecture</span>
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-accent/15 border border-accent/30 text-accent font-semibold">
                REST &amp; SSE Streaming 24/7
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-1">
                <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block">
                  Base API Endpoint
                </span>
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-foreground font-bold truncate">
                    https://daitruongstore.fly.dev/v1
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy("base-url", "https://daitruongstore.fly.dev/v1")}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Sao chép Base URL"
                  >
                    {copiedSnippet === "base-url" ? (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-1">
                <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block">
                  Header Xác Thực
                </span>
                <code className="font-mono text-foreground font-bold block truncate">
                  Authorization: Bearer sk-...
                </code>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-1">
                <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block">
                  Định dạng Key
                </span>
                <code className="font-mono text-foreground font-bold block truncate">
                  sk-... (10+ ký tự bảo mật)
                </code>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-1">
                <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block">
                  Tương thích SDK
                </span>
                <p className="text-foreground font-bold">
                  OpenAI SDK, Anthropic SDK, Cursor IDE, Claude Code CLI
                </p>
              </div>
            </div>
          </div>

          {/* Frontier AI Models Registry Reference */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Terminal className="h-4 w-4 text-accent" />
              <span>Frontier AI Models Supported (Single Source of Truth)</span>
            </h2>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2.5 font-semibold">Nhà phát triển</th>
                    <th className="pb-2.5 font-semibold">Thế hệ Model Flagship</th>
                    <th className="pb-2.5 font-semibold">Tính năng nổi bật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    {
                      provider: AI_FRONTIER_MODELS.gemini.provider,
                      generation: "Gemini 4 Argon",
                      features: `${AI_FRONTIER_MODELS.gemini.flagshipModels[0]} & Gemini 3.8/3.5 Flash`,
                    },
                    {
                      provider: AI_FRONTIER_MODELS.claude.provider,
                      generation: "Claude 5.5 & 5.6",
                      features: `${AI_FRONTIER_MODELS.claude.flagshipModels[0]}, ${AI_FRONTIER_MODELS.claude.flagshipModels[1]} & Claude Code CLI`,
                    },
                    {
                      provider: AI_FRONTIER_MODELS.openai.provider,
                      generation: "GPT-6 series & o3",
                      features: `${AI_FRONTIER_MODELS.openai.flagshipModels[0]}, ${AI_FRONTIER_MODELS.openai.flagshipModels[1]}`,
                    },
                  ].map((row) => (
                    <tr key={row.provider}>
                      <td className="py-2.5 font-bold text-foreground">{row.provider}</td>
                      <td className="py-2.5 font-mono text-primary font-bold">{row.generation}</td>
                      <td className="py-2.5 text-muted-foreground">{row.features}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Multi-Language Code Snippets with 1-Click Copy */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                <span>Code mẫu tích hợp API Gateway</span>
              </h2>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary border border-border text-xs">
                {(["curl", "python", "typescript"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveSnippetLang(lang)}
                    className={`px-3 py-1 rounded-lg font-mono font-semibold transition-all ${
                      activeSnippetLang === lang
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "curl" ? "cURL" : lang === "python" ? "Python" : "TypeScript"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                <span>{activeSnippetLang === "curl" ? "Terminal (cURL)" : activeSnippetLang === "python" ? "main.py" : "client.ts"}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`snippet-${activeSnippetLang}`, codeSnippets[activeSnippetLang])}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  {copiedSnippet === `snippet-${activeSnippetLang}` ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Sao chép code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="whitespace-pre overflow-x-auto leading-relaxed">
                <code>{codeSnippets[activeSnippetLang]}</code>
              </pre>
            </div>
          </div>

          {/* Embedded Specialized Guides */}
          {isCodex && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-accent" />
                  <span>Codex API Guide Hub</span>
                </h3>
                <Link
                  href="/huong-dan/codex"
                  target="_blank"
                  className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <span>Cẩm nang toàn diện</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <CodexApiGuideHub showKeyInput={false} />
            </div>
          )}

          {isClaude && (
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Hướng Dẫn Cấu Hình API Claude (5 Nền Tảng)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Tích hợp chuẩn xác vào Cursor AI, Claude Code CLI, VS Code Cline, Open Design và OpenClaw.
                  </p>
                </div>
              </div>
              <Link
                href="/huong-dan/api-claude"
                target="_blank"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 text-xs font-semibold transition shrink-0 shadow-xs min-h-[44px]"
              >
                <span>Xem hướng dẫn chi tiết</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
