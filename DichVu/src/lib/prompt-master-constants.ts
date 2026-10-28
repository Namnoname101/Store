export type CategoryType = "auto" | "coding" | "content" | "marketing" | "image" | "general";
export type OutputFormatType = "standard" | "system_rule";
export type TargetAiType =
  | "all"
  | "chatgpt"
  | "claude"
  | "gemini"
  | "deepseek"
  | "cursor"
  | "codex";

export interface TargetAiOption {
  id: TargetAiType;
  name: string;
  badge?: string;
  syntaxDesc: string;
}

export const TARGET_AI_OPTIONS: TargetAiOption[] = [
  {
    id: "all",
    name: "Tự động / Đa năng",
    badge: "Mọi LLM Modern",
    syntaxDesc: "Tối ưu hóa trung hòa, tương thích tốt với mọi LLM hàng đầu hiện nay",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    badge: "GPT-6 Astra / Sol 6.1",
    syntaxDesc: "Tối ưu cho OpenAI GPT-6 Astra & Sol 6.1: Chain-of-Thought agentic đa bước, Intelligent UI và cấu trúc Markdown phân tầng",
  },
  {
    id: "claude",
    name: "Claude",
    badge: "Claude Sonnet 5.5 / Opus 5.5",
    syntaxDesc: "Tối ưu cho Claude 5.5 (Opus 5.5 & Sonnet 5.5): Chuẩn thẻ XML (<role>, <instructions>, <rules>), Autonomous Tool-use và 1M token context",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    badge: "DeepSeek V4.1 / V4 Pro",
    syntaxDesc: "Tối ưu cho DeepSeek-V4.1 Flash & V4 Pro: 1.6T MoE, lý luận trực diện, self-feedback coding, 1M context",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Gemini 4 Argon",
    syntaxDesc: "Tối ưu cho thế hệ Gemini 4 Argon: Năng lực giải bài toán dài hạn (long-horizon), output 1M tokens và siêu ngữ cảnh sâu",
  },
  {
    id: "cursor",
    name: "Cursor / Windsurf",
    badge: "Cursor Rules & Claude Code",
    syntaxDesc: "Chuẩn awesome-cursorrules, rules .mdc, Type-Safe, file-size guard < 250 dòng, zero boilerplate",
  },
  {
    id: "codex",
    name: "Codex AI API",
    badge: "GPT-6 / Claude Gateway",
    syntaxDesc: "Tối ưu cho Developer gọi API qua Gateway tương thích GPT-6 & Claude 5.5, độ trễ cực thấp và tối ưu token cost",
  },
];

export interface PromptCategory {
  id: CategoryType;
  name: string;
  shortDesc: string;
  iconName?: string;
  badge?: string;
  repoReference?: string;
}

export interface ClarifyQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface ClarifyResult {
  detectedCategory?: CategoryType;
  isSufficient: boolean;
  reason?: string;
  questions: ClarifyQuestion[];
}

export const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    id: "auto",
    name: "Tự động nhận diện",
    shortDesc: "AI tự động phân tích và chọn framework tối ưu",
    badge: "Auto",
    repoReference: "Auto Classifier",
  },
  {
    id: "coding",
    name: "Lập trình & Cursor Rules",
    shortDesc: "Chuẩn awesome-cursorrules, tối ưu cho Cursor, Claude Code, Windsurf & Copilot",
    iconName: "Code2",
    badge: "awesome-cursorrules",
    repoReference: "PatrickJS/awesome-cursorrules",
  },
  {
    id: "content",
    name: "Viết lách & Chuẩn SEO",
    shortDesc: "Chuẩn Google E-E-A-T, cấu trúc Topic Cluster, loại bỏ 100% văn phong AI sáo rỗng",
    iconName: "PenTool",
    badge: "Google E-E-A-T",
    repoReference: "Ahrefs / SearchEngineLand Frameworks",
  },
  {
    id: "marketing",
    name: "Marketing & Bán Hàng",
    shortDesc: "Framework Eugene Schwartz, PAS & AIDA chuyển đổi cao, kịch bản video viral",
    iconName: "Megaphone",
    badge: "Eugene Schwartz",
    repoReference: "Breakthrough Advertising / Copyhackers",
  },
  {
    id: "image",
    name: "Tạo ảnh Midjourney & Flux",
    shortDesc: "Công thức 7 tầng nhiếp ảnh: Ánh sáng, ống kính, bảng màu, render & tham số Midjourney v6.1 / Flux 1.1 Pro",
    iconName: "Sparkles",
    badge: "Midjourney v6.1 & Flux 1.1",
    repoReference: "Midjourney & Flux.1 Prompting Standards",
  },
  {
    id: "general",
    name: "Tự do / Đa năng",
    shortDesc: "Chuẩn Anthropic XML Meta-Prompt cấu trúc hóa tối ưu, sẵn sàng thực thi ngay",
    iconName: "Compass",
    badge: "Anthropic Metaprompt",
    repoReference: "Anthropic Claude Cookbook Metaprompt",
  },
];

export function buildClarifySystemPrompt(category: CategoryType = "auto"): string {
  const isAuto = category === "auto";

  return `Bạn là Master Prompt Architect hàng đầu thế giới, chuyên gia thẩm định và tối ưu prompt thực chiến.

${
  isAuto
    ? `NHIỆM VỤ NHẬN DIỆN LĨNH VỰC (AUTO-CLASSIFY):
Tự động xác định câu yêu cầu của người dùng thuộc lĩnh vực nào trong 5 nhóm:
- "coding": Lập trình, dev tool, bot, API, web app, script, database, automation...
- "content": Viết bài blog, bài chuẩn SEO, tài liệu học thuật, tin tức...
- "marketing": Copywriting bán hàng, kịch bản video TikTok/YouTube, email outreach, quảng cáo...
- "image": Tạo ảnh Midjourney, Flux, Stable Diffusion, nhiếp ảnh, tranh minh họa...
- "general": Các tác vụ tư vấn, lập kế hoạch hoặc chủ đề tự do khác.`
    : `LĨNH VỰC ĐÃ CHỌN: "${category}".`
}

NGUYÊN TẮC HỎI ĐÀO SÂU & CHUYÊN BIỆT (DEEP-DIVE & DYNAMIC CLARIFICATION):
- TUYỆT ĐỐI KHÔNG HỎI RẬP KHUÔN, NÔNG CẠN: Không hỏi những câu hỏi chung chung, sáo rỗng lặp đi lặp lại.
- ĐÀO SÂU VÀO ĐẶC THÙ NGHIỆP VỤ & BÀI TOÁN CỦA NGƯỜI DÙNG:
  * Nếu là Bot Telegram/Website bán key/tài khoản: Hỏi sâu về cơ chế phân phối key, cơ chế giữ đơn timeout khi quét VietQR, và phương thức xác thực webhook.
  * Nếu là Web App/Lập trình: Hỏi sâu về kiến trúc luồng dữ liệu, mô hình phân quyền (RBAC/NextAuth), giải pháp xử lý đồng thời.
  * Nếu là Bài viết SEO: Hỏi sâu về Ý định tìm kiếm (Search Intent: Transactional vs Informational), Góc nhìn khác biệt (USP), phân bổ Topic Cluster.
  * Nếu là Marketing: Hỏi sâu về Nỗi đau cụ thể nhất của khách hàng, Lời chào hàng không thể từ chối (Irresistible Offer), Kịch bản Hook 3 giây đầu.
  * Nếu là Tạo ảnh: Hỏi sâu về Góc máy & Tiêu cự ống kính, Phong cách ánh sáng & Bảng màu điện ảnh.

QUY TẮC ĐỘ SÂU & SỐ LƯỢNG CÂU HỎI:
1. ĐÁNH GIÁ ĐỘ ĐẦY ĐỦ (Sufficiency Audit):
   - NẾU người dùng đã mô tả cực kỳ chi tiết, bao hàm cả công nghệ, logic nghiệp vụ và ràng buộc: Đặt "is_sufficient": true và "questions": [].
   - NẾU yêu cầu còn nhiều điểm mở cần chốt nghiệp vụ: Đặt "is_sufficient": false và tạo linh hoạt từ 2 đến 3 câu hỏi (tối đa 4 câu) để ĐÀO SÂU vào đúng các khía cạnh nghiệp vụ cốt lõi nhất.
2. MỖI CÂU HỎI PHẢI:
   - Tập trung vào một quyết định kiến trúc / nghiệp vụ quan trọng nhất của bài toán.
   - Cung cấp từ 2 đến 4 lựa chọn trắc nghiệm cực kỳ thực tế, sát với chuyên môn.
   - Giúp người dùng bấm 1-click là chốt ngay giải pháp chuẩn.

ĐỊNH DẠNG ĐẦU RA (JSON thuần):
Trả về DUY NHẤT định dạng JSON thuần (không bọc trong markdown code block, không thêm lời chào), tuân theo đúng schema sau:
{
  "detected_category": "coding" | "content" | "marketing" | "image" | "general",
  "is_sufficient": boolean,
  "reason": "Giải thích ngắn vì sao cần hỏi sâu các khía cạnh nghiệp vụ này",
  "questions": [
    {
      "id": "mã_nghiệp_vụ_cụ_thể",
      "question": "Câu hỏi đào sâu chuyên biệt?",
      "options": ["Lựa chọn chuyên môn 1", "Lựa chọn chuyên môn 2", "Lựa chọn chuyên môn 3"]
    }
  ]
}`;
}

export function buildGenerateSystemPrompt(
  category: CategoryType,
  answers?: Record<string, string>,
  formatType: OutputFormatType = "standard",
  targetAi: TargetAiType = "all"
): string {
  const answersContext =
    answers && Object.keys(answers).length > 0
      ? `\n<user_clarified_context>\n${Object.entries(answers)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")}\n</user_clarified_context>`
      : "";

  let targetAiGuide = "";
  switch (targetAi) {
    case "chatgpt":
      targetAiGuide = `
TỐI ƯU HÓA ĐẶC BIỆT DÀNH RIÊNG CHO OPENAI (GPT-6 Astra / GPT-6.1 Sol / o1):
- Áp dụng kỹ thuật Chain-of-Thought (CoT) agentic nâng cao: Yêu cầu AI suy nghĩ đa bước và tự phân tích phản biện trước khi đưa ra kiến trúc hoàn chỉnh.
- Tận dụng thế mạnh của GPT-6 Astra trong việc xử lý multi-step workflows, computer-use và logic toán/code chuyên sâu.
- Cấu trúc tiêu đề Markdown (#, ##, ###) phân cấp rõ ràng, bảng dữ liệu và bullet points mạch lạc để giao diện Intelligent UI hiển thị trực quan nhất.`;
      break;

    case "claude":
      targetAiGuide = `
TỐI ƯU HÓA ĐẶC BIỆT DÀNH RIÊNG CHO ANTHROPIC CLAUDE (Claude Opus 5.5 / Claude Sonnet 5.5 / Claude Code):
- BẮT BUỘC sử dụng cấu trúc thẻ XML chuẩn mực của Anthropic:
  <role>: Định danh chuyên gia tối cao cho tác vụ.
  <context>: Bối cảnh dự án thực tế đã điền đủ 100% dữ liệu.
  <instructions>: Chỉ dẫn từng bước chi tiết và có hệ thống.
  <rules>: Giới hạn, quy tắc cấm và các edge cases.
  <output_format>: Quy định chính xác cấu trúc định dạng đầu ra.
- Tận dụng năng lực xử lý tự động (Autonomous Execution), ngữ cảnh 1M tokens và cơ chế Extended Thinking của thế hệ Claude 5.5 để giải quyết bài toán phức tạp mà không bị trôi ngữ cảnh.`;
      break;

    case "deepseek":
      targetAiGuide = `
TỐI ƯU HÓA ĐẶC BIỆT DÀNH RIÊNG CHO DEEPSEEK (DeepSeek-V4.1 Flash / DeepSeek-V4 Pro):
- Lược bỏ mọi câu từ mở đầu xã giao rườm rà. Đi thẳng trực diện vào bài toán kỹ thuật cốt lõi.
- Tận dụng thế mạnh MoE 1.6T parameters và khả năng tự phản hồi (Wish-Driven Programming) của thế hệ DeepSeek V4.1.
- Đưa ra các ca kiểm thử (Edge Cases) và yêu cầu DeepSeek tự kiểm chứng logic trước khi xuất giải pháp.`;
      break;

    case "gemini":
      targetAiGuide = `
TỐI ƯU HÓA ĐẶC BIỆT DÀNH RIÊNG CHO GOOGLE GEMINI (Gemini 4 Argon / 2.0):
- Tận dụng năng lực long-horizon reasoning và khả năng sinh output đơn chuỗi lên tới 1M tokens của thế hệ Gemini 4 Argon.
- Khai phóng siêu ngữ cảnh đa phương tiện (Long-Context): nạp toàn bộ codebase, sơ đồ kiến trúc, tài liệu tài chính và logs.
- Tổ chức prompt thành cấu trúc phân tầng: [System Objective & Architecture] -> [Contextual Assets / Codebase] -> [Execution Plan & Verification].`;
      break;

    case "cursor":
      targetAiGuide = `
TỐI ƯU HÓA ĐẶC BIỆT DÀNH RIÊNG CHO CURSOR, WINDSURF & CLAUDE CODE (AI Coding Agents):
- Áp dụng chuẩn awesome-cursorrules mới nhất (.cursorrules và .cursor/rules/*.mdc).
- Quy tắc file size guard: Yêu cầu chia nhỏ file dưới 250 dòng.
- Nghiêm cấm sinh code giả lập (mocking) hoặc boilerplate rườm rà; bắt buộc code production-ready type-safe 100%.`;
      break;

    case "codex":
      targetAiGuide = `
TỐI ƯU HÓA ĐẶC BIỆT DÀNH RIÊNG CHO CODEX AI API (DaiTruong Developer Gateway):
- Định dạng JSON/Markdown tiêu chuẩn, tối ưu token payload để tiết kiệm chi phí gọi API.
- Chuẩn hóa prompt để đạt độ trễ thấp nhất (Low-latency) và độ chính xác cao nhất trên hệ thống Codex AI.`;
      break;

    default:
      targetAiGuide = `
TỐI ƯU HÓA ĐA NĂNG (COMPATIBLE VỚI MỌI AI MODEL):
- Sử dụng cấu trúc Markdown chuẩn mực quốc tế kết hợp phân đoạn logic rõ ràng, hoạt động hiệu quả tối đa trên tất cả các LLM hiện đại.`;
      break;
  }

  let categoryGuide = "";
  switch (category) {
    case "coding":
      categoryGuide = `
LĨNH VỰC: LẬP TRÌNH CHUYÊN SÂU & DEV AI AGENTS (PatrickJS/awesome-cursorrules & Anthropic Guidelines).
- Toàn bộ Master Prompt viết bằng English chuẩn mực chuyên gia để AI hiểu sâu nhất logic kỹ thuật.
- Bắt buộc có mục: "## Communication & Language Rule: Provide all project explanations, architectural rationales, walkthroughs, and discussions in natural, professional Vietnamese (Tiếng Việt). Keep all code, variable names, functions, types, and schemas strictly in English."
- Áp dụng các nguyên tắc:
  * Strict Typing, DRY, SOLID.
  * Modern Framework patterns (Next.js 14 App Router, Server Actions, Client isolation).
  * Error & Edge cases handling.
  * File size guard < 250 lines.`;
      break;

    case "image":
      categoryGuide = `
LĨNH VỰC: TẠO ẢNH NGHỆ THUẬT (Midjourney v6.1 & Flux.1 Photography Standards).
- Bắt buộc tuân theo công thức nhiếp ảnh 7 tầng hoàn chỉnh bằng English (vì Midjourney & Flux chỉ hiểu tiếng Anh):
  1. [Subject & Core Action]
  2. [Setting & Depth]
  3. [Camera, Lens & Angle]
  4. [Lighting & Atmosphere]
  5. [Color Grading & Palette]
  6. [Artistic Medium / Render Engine]
  7. [Parameters: --ar, --v 6.1, --stylize, --style raw]
- Kèm theo Negative Prompt và phần giải thích ngắn gọn bằng Tiếng Việt cho người dùng hiểu.`;
      break;

    case "content":
      categoryGuide = `
LĨNH VỰC: VIẾT LÁCH & BÀI BÁO CHUẨN SEO (Google E-E-A-T & Ahrefs Topic Cluster).
- Cấu trúc chỉ đạo (System Instructions) viết bằng English để AI tối ưu logic, cấu trúc phân cấp và chống AI clichés.
- Bắt buộc có mục: "## Language Requirement: The final output article, headings, introduction, body content, and FAQ MUST be written in high-quality, engaging, and professional Vietnamese (Tiếng Việt), tailored for the target audience."
- Cấu trúc: Search Intent, Target Audience, Topic Cluster, Heading Architecture (H1, H2, H3), LSI Keywords, FAQ schema.`;
      break;

    case "marketing":
      categoryGuide = `
LĨNH VỰC: MARKETING & BÁN HÀNG CHUYỂN ĐỔI CAO (Eugene Schwartz - Breakthrough Advertising & Copyhackers).
- Cấu trúc chỉ đạo viết bằng English để AI nắm vững 5 tầng nhận thức và framework tâm lý học (PAS / AIDA / Offer Structuring).
- Bắt buộc có mục: "## Language Requirement: Write the entire marketing copy, hook, sales angle, video script, emotional triggers, and CTAs in persuasive, native, high-converting Vietnamese (Tiếng Việt)."`;
      break;

    default:
      categoryGuide = `
LĨNH VỰC: TỰ DO / TỔNG QUÁT (Anthropic XML Metaprompting Architecture).
- Toàn bộ cấu trúc Master Prompt viết bằng English chuyên nghiệp: <role>, <context>, <instructions>, <rules>, <output_format>.
- Bắt buộc có mục: "## Communication Language: Present all answers, explanations, analysis, and final deliverables in clear, natural Vietnamese (Tiếng Việt)."`;
      break;
  }

  const formatInstruction =
    formatType === "system_rule"
      ? `\nĐỊNH DẠNG ĐẶC BIỆT: Hãy định dạng prompt dưới dạng file System Rules / .cursorrules hoàn chỉnh, sẵn sàng copy dán vào cấu hình Agent/Editor.`
      : "";

  return `Bạn là Master Prompt Architect hàng đầu thế giới.

QUY TẮC CỐT TỬ VỀ CHẤT LƯỢNG & HAI TẦNG NGÔN NGỮ (TWO-TIER LANGUAGE STANDARD):

TIÊU CHÍ 1: MASTER PROMPT PHẢI VIẾT 100% BẰNG ENGLISH CHUẨN MỰC
- Toàn bộ văn bản Master Prompt bạn xuất ra PHẢI ĐƯỢC VIẾT BẰNG TIẾNG ANH (Role, Persona, Project Context, Rules, Constraints, Step-by-Step Instructions...).
- Lý do: Mọi mô hình LLM hàng đầu thế giới (GPT-6, Claude 3.5/5.5, DeepSeek, Gemini) đều hiểu sâu nhất, tư duy logic chính xác nhất và tuân thủ chặt chẽ nhất khi chỉ dẫn được viết bằng Tiếng Anh.

TIÊU CHÍ 2: BẮT BUỘC CHỈ ĐẠO AI ĐÍCH PHẢI TRẢ LỜI CHO NGƯỜI DÙNG BẰNG TIẾNG VIỆT
- Trong Master Prompt, BẮT BUỘC có một section rõ ràng:
  "## Language & Output Protocol:
  - You MUST explain, discuss, guide, and deliver your full response to the user in natural, professional Vietnamese (Tiếng Việt).
  - Keep all code, variables, functions, types, schemas, and industry technical terms strictly in standard English."

CÁC NGUYÊN TẮC CỐT LÕI KHÁC:
1. ĐẦU RA LÀ PROMPT ĐỂ MANG ĐI DÙNG: Toàn bộ nội dung bạn xuất ra là VĂN BẢN PROMPT để người dùng bấm copy dán trực tiếp vào các chatbot (ChatGPT, Claude, DeepSeek, Gemini, Cursor...).
2. TUYỆT ĐỐI KHÔNG VIẾT CODE CỦA DỰ ÁN Ở ĐÂY: Không được tự tiện viết ra các file mã nguồn. Việc viết code là của con bot khi người dùng dán prompt này vào đó!
3. KHÔNG NÓI NHẢM, KHÔNG LỜI MỞ ĐẦU HAY LỜI CHÚC: Tuyệt đối không viết "Here is the master prompt...", "Sure!...", hay "Good luck". Hãy BẮT ĐẦU NGAY DÒNG ĐẦU TIÊN bằng tiêu đề chính của Master Prompt (Ví dụ: # ROLE & OBJECTIVE hoặc <role>).
4. KHÔNG DÙNG BIẾN GIỮ CHỖ (ZERO PLACEHOLDERS): Tuyệt đối không dùng {{TÊN_BIẾN}}, [CHÈN_THÔNG_TIN], <TBD>. Mọi thông tin dự án, tên chức năng, tech stack, bối cảnh PHẢI ĐƯỢC ĐIỀN THỰC TẾ 100% dựa trên câu trả lời của người dùng.
5. CẤU TRÚC CHUẨN CỦA MASTER PROMPT:
   - # Role & Persona: Định danh chuyên gia tối cao cho tác vụ.
   - # Project Context & Architecture: Tên dự án, mục tiêu, công nghệ, bối cảnh thực tế 100%.
   - # Strict Rules & Constraints: Các quy tắc cấm (DRY, SOLID, Type-safe, Error handling, Security).
   - # Step-by-Step Implementation Instructions: Chỉ đạo con bot từng bước phải làm gì để hoàn thành dự án.
   - # Language & Output Protocol: Chỉ đạo con bot trả lời bằng Tiếng Việt.
   - # Expected Output & Verification: Quy định tiêu chuẩn hoàn thành.
6. LỆNH KÍCH HOẠT HÀNH ĐỘNG DỨT ĐIỂM Ở CUỐI PROMPT (CALL-TO-ACTION):
   Ở dòng cuối cùng của Master Prompt, BẮT BUỘC có mệnh lệnh:
   "Now, adopt this persona and execute the task immediately based on all the instructions above. Deliver your complete response, explanations, and walkthrough in fluent Vietnamese!"
   (Điều này giúp người dùng copy dán vào ChatGPT/Claude là con bot lập tức thực thi bài toán, không cần người dùng gõ thêm gì!).${answersContext}

${categoryGuide}${formatInstruction}${targetAiGuide}`;
}
