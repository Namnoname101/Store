export type CategoryType = "coding" | "content" | "marketing" | "image" | "general";
export type OutputFormatType = "standard" | "system_rule";

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
    shortDesc: "Công thức 7 tầng nhiếp ảnh: Ánh sáng, ống kính, bảng màu, render & tham số --v 6.1",
    iconName: "Sparkles",
    badge: "Midjourney v6.1",
    repoReference: "Midjourney & Flux.1 Prompting Standards",
  },
  {
    id: "general",
    name: "Tự do / Đa năng",
    shortDesc: "Chuẩn Anthropic XML Meta-Prompt với thẻ phân tách cấu trúc và biến {{VARIABLE}}",
    iconName: "Compass",
    badge: "Anthropic Metaprompt",
    repoReference: "Anthropic Claude Cookbook Metaprompt",
  },
];

export function buildClarifySystemPrompt(category: CategoryType): string {
  return `Bạn là một chuyên gia Prompt Engineer đẳng cấp thế giới, am hiểu sâu sắc các framework hàng đầu như awesome-cursorrules, Eugene Schwartz Copywriting, Midjourney v6.1 Photography và Anthropic XML Metaprompting.

Nhiệm vụ: Dựa trên câu yêu cầu ban đầu của người dùng và danh mục đã chọn ("${category}"), hãy phân tích và tạo ra đúng 2 đến 3 câu hỏi trắc nghiệm cực kỳ súc tích để làm rõ ngữ cảnh kỹ thuật, mục tiêu cốt lõi hoặc định dạng mong muốn.

Yêu cầu định dạng đầu ra:
Trả về DUY NHẤT định dạng JSON thuần (không bọc trong markdown code block, không thêm lời chào), tuân theo đúng schema sau:
{
  "questions": [
    {
      "id": "mã_định_danh_ngắn",
      "question": "Câu hỏi làm rõ súc tích?",
      "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3"]
    }
  ]
}

Mỗi câu hỏi phải có từ 2 đến 4 lựa chọn sát với thực tế dự án nhất.`;
}

export function buildGenerateSystemPrompt(
  category: CategoryType,
  answers?: Record<string, string>,
  formatType: OutputFormatType = "standard"
): string {
  const answersContext =
    answers && Object.keys(answers).length > 0
      ? `\n<user_clarified_context>\n${Object.entries(answers)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")}\n</user_clarified_context>`
      : "";

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
  <instructions>: Chỉ dẫn từng bước (Step-by-step Instructions) để tránh bỏ sót chi tiết.
  <rules>: Giới hạn, quy tắc cấm và các trường hợp ngoại lệ (Edge Cases).
  <variables>: Sử dụng các biến giữ chỗ dạng {{TÊN_BIẾN}} để người dùng dễ thay thế.
  <output_format>: Quy định định dạng đầu ra chuẩn xác (Markdown, JSON, Table...).`;
      break;
  }

  const formatInstruction =
    formatType === "system_rule"
      ? `\nĐỊNH DẠNG ĐẶC BIỆT: Hãy định dạng prompt dưới dạng file System Rules / .cursorrules hoàn chỉnh, sẵn sàng copy dán vào cấu hình Agent/Editor.`
      : "";

  return `Bạn là Master Prompt Architect hàng đầu thế giới.
Nhiệm vụ của bạn: Nâng cấp câu prompt/ý tưởng thô của người dùng thành một "Master Prompt" xuất sắc, chi tiết, chuyên nghiệp và có thể đưa vào thực chiến ngay lập tức.${answersContext}

${categoryGuide}${formatInstruction}

Yêu cầu định dạng trình bày:
- Trình bày dạng Markdown với các tiêu đề rõ ràng, code block chuẩn, bullet point mạch lạc.
- Sử dụng các biến giữ chỗ trực quan dạng {{TÊN_BIẾN}} khi cần người dùng tự điền thêm thông số dự án.
- Không để lại các placeholder mơ hồ như "TBD" hay "...". Mọi quy tắc và ví dụ đều phải có nội dung hoàn chỉnh.`;
}
