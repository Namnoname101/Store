---
name: DaiTruong Store MMO HUB
description: High-reliability digital goods and AI API key delivery platform with real-time VietQR fulfillment.
colors:
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-glow: "#3b82f6"
  neutral-dark-bg: "#070b14"
  neutral-dark-card: "#0d1322"
  neutral-dark-border: "rgba(255, 255, 255, 0.08)"
  neutral-light-bg: "#f8fafc"
  neutral-light-card: "#ffffff"
  neutral-light-border: "#e2e8f0"
  success: "#10b981"
  success-bg: "rgba(16, 185, 129, 0.1)"
  warning: "#f59e0b"
  danger: "#ef4444"
typography:
  display:
    fontFamily: "IBM Plex Sans, Inter, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.15
  headline:
    fontFamily: "IBM Plex Sans, Inter, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "IBM Plex Sans, Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

## Overview

DaiTruong Store MMO HUB adopts a precision-engineered, high-contrast Dark & Light mode design language. It replaces generic AI slop (overused purple/cyan gradients and bouncy elastic springs) with crisp engineering typography, solid purposeful colors, and smooth exponential easing.

## Colors

- **Primary**: `#2563eb` (Brand Deep Royal Blue) — used for primary calls-to-action, cart submit, and core identity.
- **Success & Trust**: `#10b981` (Emerald) — indicates 100% automated 24/7 VietQR status, valid keys, and completed orders.
- **Dark Mode Surface**: Deep navy-tinted void (`#070b14`) rather than pure black or muddy gray, giving depth and terminal-grade visual stability.
- **Light Mode Surface**: Pristine slate surface (`#f8fafc`) with stark `#0f172a` typography and subtle `border-slate-200/80` borders.

## Typography

- **UI & Content**: `IBM Plex Sans` with `Inter` fallback. High legibility at small sizes (11px - 14px) with tabular figures enabled.
- **Code, Keys, & Hashes**: `JetBrains Mono` for all order codes, secret API keys, and terminal commands.

## Layout

- Fluid container capped at `max-w-7xl` with 16px - 32px horizontal padding.
- Bento-grid card layouts for categories and API tier selection.
- Sticky floating glass header with high-blur backdrop (`backdrop-blur-xl`).

## Elevation & Depth

- Modern translucent glassmorphism with subtle perimeter ring (`border-white/10` in dark mode, `border-slate-200/90` in light mode).
- Diffused, low-opacity glow shadows (`shadow-blue-500/10` to `shadow-blue-500/25`) rather than hard black drop-shadows.

## Shapes

- Rounded pill geometry (`rounded-xl` / `rounded-2xl`) for interactable elements, ensuring comfort on mobile touch devices.
- Minimum tap target of 44px on mobile viewports.

## Components

- **Catalog Cards**: Clean borders, distinct status dots (Green = Instant Stock, Blue = Managed Activation).
- **Handover Key Box**: 1-click copy with instant visual checkmark confirmation and `.txt` file export.
- **Claude Guide Hub**: Platform selector tabs (Cursor, Claude Code CLI, Windsurf, VS Code, Python) with syntax-highlighted code snippets.

## Do's and Don'ts

### Do's
- Always maintain WCAG 2.1 AA contrast ($\ge 4.5:1$).
- Use solid, authoritative text colors for headings.
- Use smooth exponential easing (`cubic-bezier(0.16, 1, 0.3, 1)`) for micro-interactions.

### Don'ts
- **No AI slop gradients**: Avoid generic purple-to-cyan text gradients or bouncy springs (`cubic-bezier(0.175, 0.885, 0.32, 1.275)`).
- **No gray on color**: Never place muted gray text on colored buttons; use pure white or high-contrast ink.
- **No tiny tap targets**: Never render icon-only buttons smaller than 36px on mobile.
