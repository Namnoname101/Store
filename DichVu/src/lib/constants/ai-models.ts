/**
 * SINGLE SOURCE OF TRUTH (SSOT) FOR AI MODELS ACROSS THE PLATFORM
 * Centralizes all frontier AI models to prevent fragmented outdated references.
 */

export const AI_FRONTIER_MODELS = {
  openai: {
    brandName: "OpenAI ChatGPT & Codex",
    latestGeneration: "GPT-6 & GPT-5 / o3 & o1 Series",
    flagshipModels: [
      "GPT-6 Series (Astra, Sol, Luna)",
      "GPT-5 Reasoning",
      "OpenAI o3 & o3-mini",
      "OpenAI o1 & o1-pro",
      "GPT-4.5 High-EQ World Model",
    ],
    summaryPill: "GPT-6, GPT-5, o3 & o1 MODEL",
    contextWindow: "1M+ Tokens Context & Deep Reasoning",
  },
  gemini: {
    brandName: "Google Gemini AI",
    latestGeneration: "Gemini 3 & Gemini 2.5 Generation",
    flagshipModels: [
      "Gemini 3 Pro & 3.5 Flash",
      "Gemini 2.5 Pro (Deep Think)",
      "Gemini 2.5 Flash Ultra-Low Latency",
    ],
    summaryPill: "GEMINI 3 PRO & 2.5 PRO • 5TB CLOUD",
    contextWindow: "2.000.000+ Tokens Multimodal Context",
  },
  claude: {
    brandName: "Anthropic Claude",
    latestGeneration: "Claude 5.5 & 5.6 Generation",
    flagshipModels: [
      "Claude Opus 5.5 (Flagship Architecture)",
      "Claude Sonnet 5.5 (Speed & Reasoning Leader)",
      "Claude Haiku 5.5",
      "Claude Code CLI & Agentic SDK",
    ],
    summaryPill: "THẾ HỆ 5.5 & 5.6 • OPUS & SONNET 5.5",
    contextWindow: "1M+ Tokens Context • Extended Reasoning",
  },
} as const;
