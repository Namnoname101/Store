/**
 * SINGLE SOURCE OF TRUTH (SSOT) FOR AI MODELS ACROSS THE PLATFORM
 * Centralizes all frontier AI models to prevent fragmented outdated references.
 */

export const AI_FRONTIER_MODELS = {
  openai: {
    provider: "OpenAI",
    brandName: "OpenAI ChatGPT & Codex",
    latestGeneration: "GPT-6 series & o3",
    flagshipModels: [
      "GPT-6 series (Astra, Sol, Luna - Next-Gen Reasoning)",
      "OpenAI o3 & o3-mini (Advanced STEM & Rapid Coding Logic)",
      "OpenAI o1 & o1-pro (Deep Chain-of-Thought Reasoning)",
      "GPT-4.5 (High-EQ World Model & Intuitive Expert)",
    ],
    summaryPill: "GPT-6 / o3 / GPT-4.5",
    contextWindow: "128k - 200k Tokens & Extended Reasoning",
    defaultModelId: "gpt-6-astra",
  },
  gemini: {
    provider: "Google Gemini",
    brandName: "Google Gemini AI & Google One",
    latestGeneration: "Gemini 4 Argon",
    flagshipModels: [
      "Gemini 4 Argon (2026 Frontier Flagship & Multi-step Agentic Workflows)",
      "Gemini 3.8 Flash (Ultra-High Speed Coding & Deep Reasoning)",
      "Gemini 3.5 Flash (Long-Context Multimodal Intelligence)",
    ],
    summaryPill: "GEMINI 4 ARGON & 3.8 FLASH • 5TB CLOUD",
    contextWindow: "2.000.000+ (2M) Tokens Context & Native Agentic Execution",
    defaultModelId: "gemini-4-argon",
  },
  claude: {
    provider: "Anthropic Claude",
    brandName: "Anthropic Claude",
    latestGeneration: "Claude 5.5 & 5.6",
    flagshipModels: [
      "Claude Opus 5.5 (Flagship Architecture)",
      "Claude Sonnet 5.5 (Speed & Reasoning Leader)",
      "Claude Haiku 5.5",
      "Claude Code CLI & Agentic SDK",
    ],
    summaryPill: "THẾ HỆ 5.5 & 5.6 • OPUS & SONNET 5.5",
    contextWindow: "1M+ Tokens Context • Extended Reasoning",
    defaultModelId: "claude-sonnet-5-5",
  },
} as const;

export const DEFAULT_CLAUDE_MODEL_ID = AI_FRONTIER_MODELS.claude.defaultModelId; // "claude-sonnet-5-5"

