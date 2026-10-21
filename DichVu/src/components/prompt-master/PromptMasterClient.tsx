"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { CategoryType, ClarifyQuestion } from "@/lib/prompt-master-constants";
import PromptInputStep from "./PromptInputStep";
import ClarifyStep from "./ClarifyStep";
import ResultStep from "./ResultStep";
import CodexCtaBanner from "./CodexCtaBanner";

type StepType = "input" | "clarify" | "result";

export default function PromptMasterClient() {
  const [step, setStep] = useState<StepType>("input");
  const [category, setCategory] = useState<CategoryType>("coding");
  const [prompt, setPrompt] = useState("");
  const [questions, setQuestions] = useState<ClarifyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [masterPrompt, setMasterPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Analyze prompt and fetch clarify questions
  const handleAnalyze = async () => {
    if (!prompt.trim() || prompt.trim().length < 3) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/tools/prompt-master/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, category }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể phân tích câu prompt lúc này.");
      }

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setStep("clarify");
      } else {
        // If no questions needed, proceed straight to generate
        await handleGenerate({});
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi khi phân tích prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Stream master prompt generation
  const handleGenerate = async (customAnswers?: Record<string, string>) => {
    setIsLoading(true);
    setIsStreaming(true);
    setStep("result");
    setMasterPrompt("");
    setErrorMessage(null);

    const answersToSend = customAnswers !== undefined ? customAnswers : answers;

    try {
      const res = await fetch("/api/tools/prompt-master/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          category,
          answers: answersToSend,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Lỗi máy chủ (${res.status})`);
      }

      if (!res.body) {
        throw new Error("Không thể kết nối luồng dữ liệu (ReadableStream).");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamBuffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split("\n");
        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === "data: [DONE]") {
            setIsStreaming(false);
            break;
          }
          if (trimmed.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.text) {
                setMasterPrompt((prev) => prev + parsed.text);
              }
            } catch {
              // Ignore invalid JSON chunks
            }
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi khi tạo Master Prompt.");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleReset = () => {
    setStep("input");
    setPrompt("");
    setQuestions([]);
    setAnswers({});
    setMasterPrompt("");
    setErrorMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Header section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-500 dark:text-blue-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Công Cụ Miễn Phí 100% — DaiTruong Tools</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Master Prompt Generator
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Biến một câu ý tưởng thô thành Master Prompt chuẩn quốc tế dành cho Cursor, Claude Code,
          SEO & Marketing. Tối ưu theo cấu trúc chuyên sâu chỉ trong 3 giây.
        </p>

        {/* Step progress pills */}
        <div className="flex items-center justify-center gap-2 pt-2 text-xs font-semibold">
          <span
            className={`px-3 py-1 rounded-full transition-all ${
              step === "input"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            1. Nhập ý tưởng
          </span>
          <span className="text-slate-300 dark:text-slate-700">→</span>
          <span
            className={`px-3 py-1 rounded-full transition-all ${
              step === "clarify"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            2. Làm rõ ngữ cảnh
          </span>
          <span className="text-slate-300 dark:text-slate-700">→</span>
          <span
            className={`px-3 py-1 rounded-full transition-all ${
              step === "result"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            3. Nhận Master Prompt
          </span>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main interactive Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 sm:p-8 backdrop-blur-md shadow-xl">
        {step === "input" && (
          <PromptInputStep
            prompt={prompt}
            category={category}
            onPromptChange={setPrompt}
            onCategoryChange={setCategory}
            onSubmit={handleAnalyze}
            isLoading={isLoading}
          />
        )}

        {step === "clarify" && (
          <ClarifyStep
            prompt={prompt}
            category={category}
            questions={questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onSubmit={() => handleGenerate()}
            onSkip={() => handleGenerate({})}
            onBack={() => setStep("input")}
            isLoading={isLoading}
          />
        )}

        {step === "result" && (
          <ResultStep
            prompt={prompt}
            masterPrompt={masterPrompt}
            isStreaming={isStreaming}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Bottom CTA to Codex */}
      <CodexCtaBanner />
    </div>
  );
}
