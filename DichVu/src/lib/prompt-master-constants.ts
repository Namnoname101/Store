export type CategoryType = "coding" | "content" | "marketing" | "image" | "general";
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
  iconName: string;
  badge?: string;
  repoReference: string;
}

export interface ClarifyQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface ClarifyResult {
  isSufficient: boolean;
  reason?: string;
  questions: ClarifyQuestion[];
}

export const PROMPT_CATEGORIES: PromptCategory[] = [
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

export function buildClarifySystemPrompt(category: CategoryType): string {
  return `Bạn là Master Prompt Architect hàng đầu thế giới, chuyên gia thẩm định và tối ưu prompt thực chiến đẳng cấp cao.

NGUYÊN TẮC HỎI ĐÀO SÂU & CHUYÊN BIỆT (DEEP-DIVE & DYNAMIC CLARIFICATION):
- TUYỆT ĐỐI KHÔNG HỎI RẬP KHUÔN, NÔNG CẠN: Không hỏi những câu hỏi chung chung, sáo rỗng lặp đi lặp lại (như chỉ hỏi "dùng stack gì", "dự án mới hay cũ").
- ĐÀO SÂU VÀO ĐẶC THÙ NGHIỆP VỤ & BÀI TOÁN CỦA NGƯỜI DÙNG:
  * Nếu là Bot Telegram bán key/tài khoản: Hỏi sâu về cơ chế phân phối key (kho key 1 lần dùng xong xóa hay tài khoản user:pass có gia hạn), cơ chế giữ đơn timeout khi quét VietQR, và phương thức xác thực webhook bảo mật (HMAC-SHA256 vs SePay/Casso).
  * Nếu là Web App/Lập trình: Hỏi sâu về kiến trúc luồng dữ liệu (Server Actions vs Client Hook), mô hình phân quyền (RBAC/NextAuth), giải pháp xử lý đồng thời (Concurrency / Race Conditions / Optimistic UI).
  * Nếu là Bài viết SEO: Hỏi sâu về Ý định tìm kiếm (Search Intent: Transactional mua hàng vs Informational chia sẻ), Góc nhìn khác biệt (USP) so với top 1 Google hiện tại, cách phân bổ dàn ý Topic Cluster.
  * Nếu là Marketing: Hỏi sâu về Nỗi đau cụ thể nhất của khách hàng, Lời chào hàng không thể từ chối (Irresistible Offer / Risk Reversal), Kịch bản Hook 3 giây đầu.
  * Nếu là Tạo ảnh: Hỏi sâu về Góc máy & Tiêu cự ống kính (85mm f/1.4 chân dung vs 24mm Cinematic Wide Shot), Phong cách ánh sáng & Bảng màu điện ảnh (Chiaroscuro, Neon Cyberpunk, Volumetric lighting, Golden hour).

QUY TẮC ĐỘ SÂU & SỐ LƯỢNG CÂU HỎI:
1. ĐÁNH GIÁ ĐỘ ĐẦY ĐỦ (Sufficiency Audit):
   - NẾU người dùng đã mô tả cực kỳ chi tiết, bao hàm cả công nghệ, logic nghiệp vụ và ràng buộc: Đặt "is_sufficient": true và "questions": [].
   - NẾU yêu cầu còn nhiều điểm mở cần chốt nghiệp vụ: Đặt "is_sufficient": false và tạo linh hoạt từ 2 đến 3 câu hỏi (hoặc tối đa 4 câu nếu bài toán phức tạp) để ĐÀO SÂU vào đúng các khía cạnh nghiệp vụ cốt lõi nhất.
2. MỖI CÂU HỎI PHẢI:
   - Tập trung vào một quyết định kiến trúc / nghiệp vụ quan trọng nhất của bài toán.
   - Cung cấp từ 2 đến 4 lựa chọn trắc nghiệm cực kỳ thực tế, sát với chuyên môn của lập trình viên / chuyên gia đầu ngành.
   - Các lựa chọn phải có tính định hướng chuyên môn cao, giúp người dùng bấm 1-click là chốt ngay giải pháp chuẩn.

ĐỊNH DẠNG ĐẦU RA (JSON thuần):
Trả về DUY NHẤT định dạng JSON thuần (không bọc trong markdown code block, không thêm lời chào), tuân theo đúng schema sau:
{
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
LĨNH VỰC: LẬP TRÌNH CHUYÊN SÂU & DEV AI AGENTS (Tham chiếu: PatrickJS/awesome-cursorrules & Anthropic Developer Prompt Guidelines).
- Ngôn ngữ prompt: Tiếng Anh chuẩn mực (English) vì Cursor, Claude Code, Windsurf và Copilot lập trình bằng tiếng Anh chính xác nhất.
- Bắt buộc áp dụng triệt để các nguyên tắc từ awesome-cursorrules:
  1. <role>: Senior Principal Software Architect & Clean Code Expert.
  2. <rules>:
     - DRY, SOLID, Single Responsibility Principle.
     - Strict Typing: Tuyệt đối không dùng 'any', bắt buộc type-safe, validate schema (Zod/Pydantic).
     - Modern Framework Patterns: Phân biệt rõ Client/Server component (Next.js 14 App Router), Server Actions, Hooks isolation.
     - Error & Edge Cases: Luôn bọc Try/Catch có ngữ cảnh, fallback UI, loading state, network timeout.
     - File Size Guard: Giới hạn file dưới 250 dòng để tránh nhồi nhét trách nhiệm.
     - Zero Boilerplate: Không viết code giả lập, không dùng thư viện không có thật.
  3. <instructions>: Quy trình từng bước rõ ràng (Step-by-step Instructions & Implementation details), test-driven (TDD).
  4. <cursorrules_tip>: Ở cuối, hướng dẫn ngắn gọn bằng Tiếng Việt cách tạo file '.cursorrules' hoặc '.cursor/rules/*.mdc' trong dự án để áp dụng ngay.`;
      break;

    case "image":
      categoryGuide = `
LĨNH VỰC: TẠO ẢNH NGHỆ THUẬT (Tham chiếu: Midjourney v6.1 & Flux.1 Photography Standards).
- Bắt buộc tuân theo công thức nhiếp ảnh 7 tầng hoàn chỉnh:
  1. [Subject & Core Action]: Miêu tả chi tiết nhân vật/chủ thể, thần thái, trang phục, hành động.
  2. [Setting & Depth]: Bối cảnh xung quanh, tiền cảnh (foreground), hậu cảnh (background), độ sâu trường ảnh (bokeh).
  3. [Camera, Lens & Angle]: Tên máy ảnh & ống kính chuyên nghiệp (e.g. 85mm f/1.4 lens, Sony A7R V, Hasselblad 500C, low angle shot, cinematic wide shot).
  4. [Lighting & Atmosphere]: Ánh sáng điện ảnh (volumetric lighting, cinematic chiaroscuro, golden hour, moody rim light, neon cyberpunk glow).
  5. [Color Grading & Palette]: Bảng màu (Kodachrome 64, cinematic teal & orange, muted pastel, monochromatic).
  6. [Artistic Medium / Render Engine]: 35mm film photography, photorealistic editorial, Octane Render 8K, Unreal Engine 5.5.
  7. [Parameters]: Các tham số chính xác của Midjourney: '--ar 16:9' (hoặc 9:16 tùy chủ đề), '--v 6.1', '--stylize 250', '--style raw'.
- Kèm theo mục Negative Prompt (loại bỏ biến dạng tay chân, mờ nhòe, watermark) và phần giải thích ngắn gọn bằng Tiếng Việt.`;
      break;

    case "content":
      categoryGuide = `
LĨNH VỰC: VIẾT LÁCH & BÀI BÁO CHUẨN SEO (Tham chiếu: Google E-E-A-T & Ahrefs Topic Cluster Framework).
- Ngôn ngữ: Tiếng Việt chuẩn mực, giàu tính học thuật và thực tiễn.
- BỘ QUY TẮC CHẶN VĂN PHONG AI SÁO RỖNG (Anti-AI Clichés):
  * TUYỆT ĐỐI KHÔNG dùng các từ sáo rỗng thường thấy của AI: 'Trong kỷ nguyên số ngày nay', 'Đóng vai trò quan trọng', 'Minh chứng cho', 'Bức tranh toàn cảnh', 'Không thể phủ nhận', 'Tóm lại là'...
  * Vào đề trực diện bằng một luận điểm bất ngờ, một câu chuyện thực tế hoặc một số liệu ấn tượng.
- Cấu trúc Master Prompt cần có:
  1. Role: Chuyên gia đầu ngành trong lĩnh vực có hơn 10 năm kinh nghiệm (E-E-A-T).
  2. Search Intent & Target Audience: Ý định tìm kiếm và chân dung người đọc chi tiết.
  3. Topic Cluster & Heading Architecture: Dàn ý chi tiết H1, H2, H3 theo luồng logic tự nhiên.
  4. Semantic Keywords (LSI): Hướng dẫn chèn từ khóa ngữ nghĩa một cách tự nhiên.
  5. Format & FAQ: Định dạng xuất bản kèm 3-5 câu hỏi thường gặp (FAQ Schema).`;
      break;

    case "marketing":
      categoryGuide = `
LĨNH VỰC: MARKETING & BÁN HÀNG CHUYỂN ĐỔI CAO (Tham chiếu: Eugene Schwartz - Breakthrough Advertising & Copyhackers).
- Áp dụng các framework tâm lý học hành vi đỉnh cao:
  1. Xác định 5 Tầng nhận thức khách hàng (Unaware, Problem-Aware, Solution-Aware, Product-Aware, Most-Aware).
  2. Frameworks trực diện: PAS (Problem - Agitate - Solve) hoặc AIDA (Attention - Interest - Desire - Action).
- Cấu trúc Master Prompt cần có:
  1. The Hook (3 giây đầu / Tiêu đề giật gân): Ngăn chặn hành động lướt qua (Pattern Interrupt).
  2. The Emotional Trigger: Đào sâu vào nỗi đau thực tế và sự thất vọng của khách hàng.
  3. The Unique Mechanism: Giải thích vì sao giải pháp này vượt trội hoàn toàn so với cách cũ.
  4. Social Proof & Irresistible Offer: Bằng chứng thuyết phục, chính sách bảo đảm rủi ro (Risk Reversal).
  5. High-Converting CTA: Kêu gọi hành động khẩn cấp và dứt khoát.`;
      break;

    default:
      categoryGuide = `
LĨNH VỰC: TỰ DO / TỔNG QUÁT (Tham chiếu: Anthropic Official XML Metaprompting Architecture).
- Áp dụng phân tách cấu trúc bằng thẻ XML rõ ràng:
  <role>: Xác định danh tính chuyên gia tối cao cho tác vụ.
  <task_description>: Mục tiêu chính xác cần đạt được.
  <context_and_scope>: Xác định phạm vi và bối cảnh dự án cụ thể (điền tên dự án, module và giai đoạn thực tế, KHÔNG dùng biến giữ chỗ).
  <instructions>: Chỉ dẫn từng bước (Step-by-step Instructions) để tránh bỏ sót chi tiết.
  <rules>: Giới hạn, quy tắc cấm và các trường hợp ngoại lệ (Edge Cases).
  <output_format>: Quy định định dạng đầu ra chuẩn xác (Markdown, JSON, Table...).`;
      break;
  }

  const formatInstruction =
    formatType === "system_rule"
      ? `\nĐỊNH DẠNG ĐẶC BIỆT: Hãy định dạng prompt dưới dạng file System Rules / .cursorrules hoàn chỉnh, sẵn sàng copy dán vào cấu hình Agent/Editor.`
      : "";

  return `Bạn là Master Prompt Architect hàng đầu thế giới.

QUY TẮC CỐT TỬ (BẠN LÀ TRÌNH TẠO PROMPT, KHÔNG PHẢI TRÌNH VIẾT CODE):
1. ĐẦU RA LÀ PROMPT ĐỂ MANG ĐI DÙNG: Toàn bộ nội dung bạn xuất ra là VĂN BẢN PROMPT để người dùng bấm copy dán vào AI đích (Cursor, Claude Code, ChatGPT, DeepSeek...).
2. TUYỆT ĐỐI KHÔNG VIẾT CODE CỦA DỰ ÁN Ở ĐÂY: Không được tự tiện viết ra các file mã nguồn (như main.py, config.py, database.py, requirements.txt...). Việc viết code là của AI đích khi người dùng dán prompt này vào đó!
3. KHÔNG NÓI NHẢM, KHÔNG LỜI MỞ ĐẦU HAY LỜI CHÚC: Tuyệt đối không viết "Dưới đây là Master Prompt...", "Dưới đây là nội dung...", hay "Chúc bạn thành công". Hãy BẮT ĐẦU NGAY DÒNG ĐẦU TIÊN bằng tiêu đề chính của Master Prompt (Ví dụ: # ROLE & OBJECTIVE hoặc <role>).
4. KHÔNG DÙNG BIẾN GIỮ CHỖ (ZERO PLACEHOLDERS): Tuyệt đối không dùng {{TÊN_BIẾN}}, [CHÈN_THÔNG_TIN], <TBD>. Mọi thông tin dự án, tên chức năng, tech stack, bối cảnh PHẢI ĐƯỢC ĐIỀN THỰC TẾ 100% dựa trên câu trả lời của người dùng.
5. CẤU TRÚC CHUẨN CỦA MASTER PROMPT ĐƯỢC XUẤT RA:
   - # Role & Persona: Định danh chuyên gia tối cao cho tác vụ.
   - # Project Context & Architecture: Tên dự án, mục tiêu, công nghệ, hiện trạng codebase đã điền cụ thể 100%.
   - # Strict Rules & Constraints: Các quy tắc cấm (dry, solid, strict typing, error handling, file size guard, security).
   - # Step-by-Step Implementation Instructions: Chỉ đạo AI đích từng bước phải làm gì để hoàn thành dự án.
   - # Expected Output & Verification: Quy định cách AI đích trả lời và kiểm thử.${answersContext}

${categoryGuide}${formatInstruction}${targetAiGuide}`;
}
