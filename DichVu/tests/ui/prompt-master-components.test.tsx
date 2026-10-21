import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PromptInputStep from "@/components/prompt-master/PromptInputStep";
import ClarifyStep from "@/components/prompt-master/ClarifyStep";
import ResultStep from "@/components/prompt-master/ResultStep";
import CodexCtaBanner from "@/components/prompt-master/CodexCtaBanner";

describe("Prompt Master UI Sub-Components", () => {
  it("renders CodexCtaBanner with link to /codex", () => {
    const html = renderToStaticMarkup(React.createElement(CodexCtaBanner));
    expect(html).toContain("/codex");
    expect(html).toContain("Codex");
    expect(html).toContain("Nạp Codex API Credit");
  });

  it("renders PromptInputStep with textarea and category options", () => {
    const html = renderToStaticMarkup(
      React.createElement(PromptInputStep, {
        prompt: "tạo auth nextjs",
        category: "coding",
        onPromptChange: vi.fn(),
        onCategoryChange: vi.fn(),
        onSubmit: vi.fn(),
        isLoading: false,
      })
    );
    expect(html).toContain("tạo auth nextjs");
    expect(html).toContain("Phân tích &amp; Tối ưu");
    expect(html).toContain("Lập trình &amp; Cursor Rules");
  });

  it("renders ClarifyStep with questions and options", () => {
    const mockQuestions = [
      {
        id: "q1",
        question: "Chọn cơ sở dữ liệu?",
        options: ["PostgreSQL", "MongoDB", "SQLite"],
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(ClarifyStep, {
        prompt: "tạo auth nextjs",
        category: "coding",
        questions: mockQuestions,
        answers: { q1: "PostgreSQL" },
        onAnswerChange: vi.fn(),
        onSubmit: vi.fn(),
        onSkip: vi.fn(),
        onBack: vi.fn(),
        isLoading: false,
      })
    );
    expect(html).toContain("Chọn cơ sở dữ liệu?");
    expect(html).toContain("PostgreSQL");
    expect(html).toContain("Tạo Master Prompt");
    expect(html).toContain("Bỏ qua &amp; Tạo ngay");
  });

  it("renders ResultStep with copy, download, and prompt display", () => {
    const html = renderToStaticMarkup(
      React.createElement(ResultStep, {
        prompt: "tạo auth nextjs",
        masterPrompt: "# Master Prompt Content",
        isStreaming: false,
        onReset: vi.fn(),
      })
    );
    expect(html).toContain("# Master Prompt Content");
    expect(html).toContain("Sao chép 1-Click");
    expect(html).toContain("Tải .md");
  });
});
