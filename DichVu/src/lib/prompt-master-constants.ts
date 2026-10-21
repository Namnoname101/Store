export type CategoryType = "coding" | "content" | "marketing" | "image" | "general";

export interface PromptCategory {
  id: CategoryType;
  name: string;
  shortDesc: string;
  iconName: string;
  badge?: string;
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
    shortDesc: "Tối ưu cho Cursor, Claude Code, Windsurf, Copilot, refactor và kiến trúc hệ thống",
    iconName: "Code2",
    badge: "Phổ biến",
  },
  {
    id: "content",
    name: "Viết lách & Chuẩn SEO",
    shortDesc: "Bài viết chuyên sâu, văn phong tự nhiên, outline phân tích tránh văn phong AI",
    iconName: "PenTool",
  },
  {
    id: "marketing",
    name: "Marketing & Bán Hàng",
    shortDesc: "Framework AIDA/PAS, kịch bản video ngắn, copywriting thuyết phục chuyển đổi",
    iconName: "Megaphone",
  },
  {
    id: "image",
    name: "Tạo ảnh Midjourney & Flux",
    shortDesc: "Mô tả chi tiết góc máy, ánh sáng, phong cách nghệ thuật, negative prompt",
    iconName: "Sparkles",
  },
  {
    id: "general",
    name: "Tự do / Đa năng",
    shortDesc: "Cấu trúc Master Prompt chuẩn hóa CRISPE cho mọi nhiệm vụ tổng quát",
    iconName: "Compass",
  },
];

export function buildClarifySystemPrompt(category: CategoryType): string {
  return `Bạn là một chuyên gia Prompt Engineer đẳng cấp thế giới.
Nhiệm vụ của bạn: Dựa trên câu yêu cầu ban đầu của người dùng và lĩnh vực đã chọn ("${category}"), hãy phân tích và tạo ra đúng 2 đến 3 câu hỏi trắc nghiệm ngắn gọn để làm rõ ngữ cảnh kỹ thuật, mục tiêu hoặc công cụ sử dụng.

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

Mỗi câu hỏi phải có từ 2 đến 4 lựa chọn súc tích, thực tế.`;
}

export function buildGenerateSystemPrompt(
  category: CategoryType,
  answers?: Record<string, string>
): string {
  const answersContext = answers && Object.keys(answers).length > 0
    ? `\nThông tin bối cảnh người dùng đã làm rõ:\n${Object.entries(answers)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n")}`
    : "";

  let categoryGuide = "";
  switch (category) {
    case "coding":
      categoryGuide = `
LĨNH VỰC: LẬP TRÌNH & DEV AI AGENTS (Cursor, Claude Code, Windsurf).
- Hãy tạo Master Prompt bằng Tiếng Anh chuẩn quốc tế (vì Cursor và Claude hiểu code tiếng Anh chính xác nhất).
- Cấu trúc cần rõ ràng:
  1. Role & Objective: Chuyên gia Senior Full-stack / Software Architect.
  2. Tech Stack & Version constraints.
  3. Strict Rules: Không viết boilerplate thừa, luôn xử lý lỗi & typing an toàn, DRY, TDD.
  4. Step-by-step Instructions & Implementation details.
  5. Output format.
- Kèm theo 1 đoạn giải thích ngắn bằng Tiếng Việt ở cuối hướng dẫn cách dán vào .cursorrules hoặc prompt box.`;
      break;
    case "image":
      categoryGuide = `
LĨNH VỰC: TẠO ẢNH NGHỆ THUẬT (Midjourney, Flux, Stable Diffusion).
- Hãy xuất Prompt chính bằng Tiếng Anh (English prompt) miêu tả chi tiết: Chủ thể, bố cục, ánh sáng, bảng màu, ống kính, phong cách nghệ thuật, kèm thông số tham số như --ar 16:9 --v 6.1.
- Kèm theo Negative prompt và giải thích ý tưởng bằng Tiếng Việt.`;
      break;
    case "content":
      categoryGuide = `
LĨNH VỰC: VIẾT LÁCH & BÀI VIẾT CHUẨN SEO.
- Hãy tạo Master Prompt bằng Tiếng Việt chuẩn mực, giàu tính chuyên môn.
- Cấu trúc: Vai trò chuyên gia, Mục tiêu bài viết, Đối tượng độc giả, Giọng văn (Tone of voice), Cấu trúc dàn ý chi tiết, Các quy tắc cấm (không dùng từ sáo rỗng, không lặp từ).`;
      break;
    case "marketing":
      categoryGuide = `
LĨNH VỰC: MARKETING & BÁN HÀNG.
- Hãy tạo Master Prompt ứng dụng các framework tâm lý học (AIDA, PAS, BAB).
- Cấu trúc: Mục tiêu chuyển đổi, Chân dung khách hàng (ICP), Điểm đau (Pain points), Kêu gọi hành động (CTA), và định dạng xuất bản.`;
      break;
    default:
      categoryGuide = `
LĨNH VỰC: TỰ DO / TỔNG QUÁT.
- Áp dụng framework CRISPE (Capacity, Role, Insight, Statement, Personality, Experiment).
- Tạo prompt mạch lạc, có phân chia đầu mục rõ ràng để mọi mô hình AI hiểu sâu sắc và thực thi chính xác.`;
      break;
  }

  return `Bạn là một Master Prompt Architect hàng đầu.
Người dùng cung cấp một ý tưởng hoặc câu prompt thô. Bạn hãy chuyển đổi nó thành một "Master Prompt" hoàn chỉnh, chuyên nghiệp và có độ chi tiết cao.${answersContext}

${categoryGuide}

Định dạng kết quả đầu ra:
- Trình bày dạng Markdown với các tiêu đề rõ ràng, code block chuẩn, bullet point mạch lạc.
- Master Prompt phải có tính ứng dụng thực tế ngay lập tức, không để lại các placeholder mơ hồ như "TBD" hay "...".`;
}
