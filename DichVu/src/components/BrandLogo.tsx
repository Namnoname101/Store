import React from "react";

interface BrandLogoProps {
  brandName?: string | null;
  className?: string;
  size?: number;
}

export function normalizeBrandName(name?: string | null): string {
  if (!name) return "default";
  const lower = name.toLowerCase().trim();
  if (lower.includes("openai") || lower.includes("chatgpt") || lower.includes("gpt")) return "openai";
  if (lower.includes("claude") || lower.includes("anthropic")) return "claude";
  if (lower.includes("cursor")) return "cursor";
  if (lower.includes("codex")) return "codex";
  if (lower.includes("gemini") || lower.includes("google")) return "gemini";
  if (lower.includes("deepseek")) return "deepseek";
  if (lower.includes("capcut")) return "capcut";
  if (lower.includes("office") || lower.includes("365") || lower.includes("microsoft")) return "microsoft";
  if (lower.includes("canva")) return "canva";
  if (lower.includes("locket")) return "locket";
  if (lower.includes("telegram")) return "telegram";
  if (lower.includes("github")) return "github";
  return "default";
}

export default function BrandLogo({ brandName, className = "w-4 h-4", size = 16 }: BrandLogoProps) {
  const brandKey = normalizeBrandName(brandName);

  switch (brandKey) {
    case "openai":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M20.5 12.3c-.2-1.3-.9-2.4-2-3.1.2-.8.1-1.7-.3-2.4-.6-1.1-1.7-1.7-2.9-1.7-.5 0-1 .1-1.5.4C13 4.6 11.8 4 10.5 4c-1.8 0-3.3 1.2-3.8 2.9-.8.2-1.6.7-2.1 1.4-.8 1.1-.9 2.5-.4 3.7-1 .6-1.7 1.7-1.7 2.9 0 1.5.9 2.8 2.2 3.4-.1.8 0 1.7.5 2.4.6 1.1 1.7 1.7 2.9 1.7.5 0 1-.1 1.5-.4.8.9 2 1.5 3.3 1.5 1.8 0 3.3-1.2 3.8-2.9.8-.2 1.6-.7 2.1-1.4.8-1.1.9-2.5.4-3.7 1-.6 1.8-1.7 1.8-2.9 0-.1 0-.3-.1-.6z" />
          <path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
        </svg>
      );

    case "claude":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          {/* Anthropic / Claude warm orange terracotta symbol */}
          <path d="M13.8 2.5h-3.6l-6 19h4.3l1.4-4.5h4.2l1.4 4.5h4.3l-6-19zm-3.1 11.2l1.3-4.4 1.3 4.4h-2.6z" />
        </svg>
      );

    case "cursor":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Cursor AI isometric prism */}
          <polygon points="12 2 2 8 12 14 22 8 12 2" fill="currentColor" fillOpacity="0.2" />
          <polyline points="2 8 2 16 12 22 22 16 22 8" />
          <line x1="12" y1="14" x2="12" y2="22" />
        </svg>
      );

    case "codex":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
      );

    case "gemini":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          {/* Google Gemini four-pointed star */}
          <path d="M12 2c.2 4.6 2.6 7 7.2 7.2-4.6.2-7 2.6-7.2 7.2-.2-4.6-2.6-7-7.2-7.2 4.6-.2 7-2.6 7.2-7.2z" />
          <path d="M18.5 15.5c.1 2 .9 2.8 2.9 2.9-2 .1-2.8.9-2.9 2.9-.1-2-.9-2.8-2.9-2.9 2-.1 2.8-.9 2.9-2.9z" opacity="0.7" />
        </svg>
      );

    case "deepseek":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          {/* DeepSeek whale tail / curved dolphin fin */}
          <path d="M4 14.5c2-4 7-8.5 14-8.5-1 4.5-4 9-9 11-3 1.2-5.5-.5-5-2.5z" />
          <circle cx="16" cy="8" r="1.5" />
        </svg>
      );

    case "capcut":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          {/* CapCut overlapping cuts */}
          <path d="M4 6.5L12 11 20 6.5 12 2 4 6.5zm0 11L12 22l8-4.5-8-4.5-8 4.5z" />
        </svg>
      );

    case "microsoft":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <rect x="3" y="3" width="8.5" height="8.5" rx="1" />
          <rect x="12.5" y="3" width="8.5" height="8.5" rx="1" />
          <rect x="3" y="12.5" width="8.5" height="8.5" rx="1" />
          <rect x="12.5" y="12.5" width="8.5" height="8.5" rx="1" />
        </svg>
      );

    case "canva":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9.5a4 4 0 1 0 0 5" />
        </svg>
      );

    case "locket":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="3" y="8" width="18" height="13" rx="3" />
          <path d="M7 8V6a5 5 0 0 1 10 0v2" />
          <path d="M12 13v3" />
        </svg>
      );

    case "telegram":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M21.5 4.5l-19 7.3c-1.3.5-1.3 1.3-.2 1.6l4.9 1.5 11.3-7.1c.5-.3 1-.1.6.2l-9.2 8.3v4.1c0 .6.4.8.8.4l2.5-2.4 5.2 3.8c1 .5 1.7.2 2-1l3.3-15.5c.3-1.4-.5-2-1.4-1.2z" />
        </svg>
      );

    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
  }
}
