"use client";

import React, { useState } from "react";
import {
  CategoryType,
  ClarifyQuestion,
  OutputFormatType,
  TargetAiType,
} from "@/lib/prompt-master-constants";
import PromptInputStep from "./PromptInputStep";
import ClarifyStep from "./ClarifyStep";
import AnalyzingStep from "./AnalyzingStep";
import ResultStep from "./ResultStep";
import CodexCtaBanner from "./CodexCtaBanner";

type StepType = "input" | "clarify" | "result";

export default function PromptMasterClient() {
  const [step, setStep] = useState<StepType>("input");
  const [category, setCategory] = useState<CategoryType>("auto");
  const [formatType, setFormatType] = useState<OutputFormatType>("standard");
  const [targetAi, setTargetAi] = useState<TargetAiType>("all");
  const [prompt, setPrompt] = useState("");
  const [questions, setQuestions] = useState<ClarifyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [masterPrompt, setMasterPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sufficiencyNotice, setSufficiencyNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Analyze prompt and transition to clarify questions or directly to generate
  const handleAnalyze = async () => {
    if (!prompt.trim() || prompt.trim().length < 3) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSufficiencyNotice(null);

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

      // Auto-update category if detected from prompt
      let resolvedCat = category;
      if (data.detectedCategory && data.detectedCategory !== "auto") {
        resolvedCat = data.detectedCategory;
        setCategory(data.detectedCategory);
      }

      // If prompt is already detailed or no questions needed: skip clarify step and generate immediately
      if (data.isSufficient === true || !data.questions || data.questions.length === 0) {
        setSufficiencyNotice("Ý tưởng của bạn đã rất rõ ràng! Đang tiến hành tạo Master Prompt...");
        setQuestions([]);
        await handleGenerate({}, resolvedCat);
      } else {
        setQuestions(data.questions);
        setStep("clarify");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi khi phân tích prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Stream master prompt generation into central result card
  const handleGenerate = async (
    customAnswers?: Record<string, string>,
    overrideCategory?: CategoryType
  ) => {
    setIsLoading(true);
    setIsStreaming(true);
    setStep("result");
    setMasterPrompt("");
    setErrorMessage(null);

    const answersToSend = customAnswers !== undefined ? customAnswers : answers;
    const catToSend = overrideCategory || category;

    try {
      const res = await fetch("/api/tools/prompt-master/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          category: catToSend,
          answers: answersToSend,
          formatType,
          targetAi,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Lỗi máy chủ (${res.status})`);
      }

      if (!res.body) {
        throw new Error("Không thể kết nối luồng dữ liệu.");
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
    setCategory("auto");
    setTargetAi("all");
    setQuestions([]);
    setAnswers({});
    setMasterPrompt("");
    setSufficiencyNotice(null);
    setErrorMessage(null);
  };

  return (
    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Header section - Clean, human typography, no icon clutter */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Master Prompt Generator
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
          Gõ 1 câu ý tưởng thô — AI sẽ làm rõ chi tiết và xuất ra Master Prompt chuẩn mực cho Cursor, Claude, ChatGPT hoặc Midjourney.
        </p>
      </div>

      {/* Sufficiency feedback alert */}
      {sufficiencyNotice && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 text-center animate-fade-slide-in">
          {sufficiencyNotice}
        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400 text-center animate-fade-slide-in">
          {errorMessage}
        </div>
      )}

      {/* Dynamic Step View */}
      {step === "input" && (
        isLoading ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs">
            <AnalyzingStep
              prompt={prompt}
              category={category}
              targetAi={targetAi}
            />
          </div>
        ) : (
          <PromptInputStep
            prompt={prompt}
            category={category}
            formatType={formatType}
            targetAi={targetAi}
            onPromptChange={setPrompt}
            onCategoryChange={setCategory}
            onFormatTypeChange={setFormatType}
            onTargetAiChange={setTargetAi}
            onSubmit={handleAnalyze}
            isLoading={isLoading}
          />
        )
      )}

      {step === "clarify" && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-7 shadow-xs">
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
        </div>
      )}

      {step === "result" && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-7 shadow-xs">
          <ResultStep
            prompt={prompt}
            category={category}
            targetAi={targetAi}
            masterPrompt={masterPrompt}
            isStreaming={isStreaming}
            onReset={handleReset}
          />
        </div>
      )}

      {/* Bottom CTA to Codex */}
      <CodexCtaBanner />
    </div>
  );
}