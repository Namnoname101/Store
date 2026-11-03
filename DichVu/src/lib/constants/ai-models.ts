/**
 * SINGLE SOURCE OF TRUTH (SSOT) FOR AI MODELS ACROSS THE PLATFORM
 * Centralizes all frontier AI models to prevent fragmented outdated references.
 */

export const AI_FRONTIER_MODELS = {
  openai: {
    brandName: "OpenAI ChatGPT & Codex",
    latestGeneration: "GPT-4.5, o3 & o1 Series",
    flagshipModels: [
      "GPT-4.5 (High-EQ World Model & Intuitive Expert)",
      "OpenAI o1 & o1-pro (Deep Chain-of-Thought Reasoning)",
      "OpenAI o3 & o3-mini (Advanced STEM & Rapid Coding Logic)",
      "GPT-4o & GPT-4o mini (Native Omni Multimodal Workhorse)",
    ],
    summaryPill: "GPT-4.5, o3 & o1 MODEL",
    contextWindow: "128k - 200k Tokens & Extended Reasoning",
  },
  gemini: {
    brandName: "Google Gemini AI & Google One",
    latestGeneration: "Gemini 2.0 & Gemini 1.5 Generation",
    flagshipModels: [
      "Gemini 2.0 Flash (Multimodal Live & Real-time Reasoning)",
      "Gemini 2.0 Pro Experimental (Advanced Coding & Complex Logic)",
      "Gemini 2.0 Flash-Lite (High Efficiency & Low Latency)",
      "Gemini 1.5 Pro (2.000.000 Tokens Context Window)",
    ],
    summaryPill: "GEMINI 2.0 FLASH & PRO • 2M CONTEXT • 5TB CLOUD",
    contextWindow: "2.000.000 (2M) Tokens Context & Native Multimodality",
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
