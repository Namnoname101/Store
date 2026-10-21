# Master Prompt Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng công cụ Lead Magnet công khai "Master Prompt Generator" trên web DaiTruong Store với luồng 2-bước (phân tích/làm rõ và sinh master prompt streaming thời gian thực qua Google Gemini API Free Tier) cùng hệ thống nút Copy/Download và banner CTA chuyển đổi sang dịch vụ Codex API.

**Architecture:** Sử dụng Next.js 14 App Router, tích hợp API Google Gemini (Free Tier: `gemini-flash-lite-latest`) ở phía backend, trang bị Rate Limiting IP theo sliding-window qua `src/lib/rate-limiter.ts`. Giao diện Client Component tương tác mượt mà hỗ trợ Server-Sent Events (SSE) stream, phân loại category (Coding, Content, Marketing, Midjourney, General) và điều hướng về trang `/codex`.

**Tech Stack:** Next.js 14.2 (App Router), React 18, TypeScript 5.6, Tailwind CSS 3.4, Lucide React, Vitest 2.1.

**Spec:** `docs/superpowers/specs/2026-10-21-master-prompt-generator-design.md`

## Global Constraints
- **Bảo mật API Key:** Biến môi trường `GEMINI_API_KEY` chỉ đọc ở server-side, không bao giờ expose qua `NEXT_PUBLIC_` hay client bundle.
- **Chống lạm dụng (Rate Limiting):** Sử dụng `checkRateLimit` từ `src/lib/rate-limiter.ts` với ngưỡng 15 req/h cho Clarify và 10 req/h cho Generate cho mỗi IP.
- **Giao thức Chuẩn:** Sử dụng native `fetch` và Web Streams API (`ReadableStream`), không cài thêm các SDK nặng không cần thiết.
- **Tương thích UI:** Thiết kế dark slate đồng bộ với hệ thống giao diện hiện tại của DaiTruong Store (`/codex`, `/products`).
- **Không hồi quy (Zero Regression):** Toàn bộ test suite hiện có của dự án phải tiếp tục pass 100%.

## Review Focus
1. Người dùng nhập chuỗi rỗng hoặc chuỗi quá ngắn (< 3 ký tự) hoặc quá dài (> 1000 ký tự) phải bị chặn với thông báo lỗi 400 rõ ràng.
2. Vượt ngưỡng Rate Limit phải trả về HTTP 429 kèm header/thông điệp thời gian reset còn lại.
3. Khi upstream Gemini bị lỗi (503/timeout), client phải hiển thị thông báo lỗi thân thiện thay vì màn hình trắng hay treo giao diện.
4. Quá trình SSE stream không bị đứt gãy ký tự Unicode tiếng Việt khi chia chunk.
5. Người dùng bấm "Bỏ qua & Tạo ngay" (không chọn câu trả lời clarify) thì API generate vẫn tạo prompt thành công với giá trị mặc định.

---

### Task 1: Prompt Master Constants & Gemini Client Helper

**Files:**
- Create: `src/lib/prompt-master-constants.ts`
- Create: `src/lib/gemini-client.ts`
- Test: `tests/lib/gemini-client.test.ts`

**Interfaces:**
- Produces: 
  - `PROMPT_CATEGORIES`, `CategoryType`, `ClarifyQuestion`, `BuildMetaPromptOptions` từ `prompt-master-constants.ts`
  - `callGeminiClarify(prompt: string, category: CategoryType): Promise<{ questions: ClarifyQuestion[] }>`
  - `callGeminiGenerateStream(prompt: string, category: CategoryType, answers?: Record<string, string>): Promise<ReadableStream<Uint8Array>>`

- [ ] **Step 1: Write the failing test for AgentRouter client helper & constants**

```typescript
// tests/lib/agentrouter-client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PROMPT_CATEGORIES, buildClarifySystemPrompt, buildGenerateSystemPrompt } from "@/lib/prompt-master-constants";
import { callAgentRouterClarify, callAgentRouterGenerateStream } from "@/lib/agentrouter-client";

describe("Prompt Master Constants & AgentRouter Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should define supported prompt categories", () => {
    expect(PROMPT_CATEGORIES.some((c) => c.id === "coding")).toBe(true);
    expect(PROMPT_CATEGORIES.some((c) => c.id === "content")).toBe(true);
    expect(PROMPT_CATEGORIES.some((c) => c.id === "marketing")).toBe(true);
    expect(PROMPT_CATEGORIES.some((c) => c.id === "image")).toBe(true);
    expect(PROMPT_CATEGORIES.some((c) => c.id === "general")).toBe(true);
  });

  it("should build valid system prompts for clarify and generate", () => {
    const clarifyPrompt = buildClarifySystemPrompt("coding");
    expect(clarifyPrompt).toContain("questions");
    expect(clarifyPrompt).toContain("JSON");

    const genPrompt = buildGenerateSystemPrompt("coding");
    expect(genPrompt).toContain("Role");
    expect(genPrompt).toContain("Instructions");
  });

  it("should call AgentRouter clarify and parse questions JSON safely", async () => {
    const mockJson = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              questions: [
                {
                  id: "stack",
                  question: "Bạn dùng stack nào?",
                  options: ["Next.js", "Python"],
                },
              ],
            }),
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJson,
    } as any);

    const result = await callAgentRouterClarify("viết bot cào dữ liệu", "coding");
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].id).toBe("stack");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/agentrouter-client.test.ts`  
Expected: FAIL with "Cannot find module '@/lib/prompt-master-constants'"

- [ ] **Step 3: Implement `src/lib/prompt-master-constants.ts` and `src/lib/agentrouter-client.ts`**

Implement constants with comprehensive system instructions and OpenAI chat completions integration with fallback handling.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/agentrouter-client.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/prompt-master-constants.ts src/lib/agentrouter-client.ts tests/lib/agentrouter-client.test.ts
git commit -m "feat(prompt-master): add constants and agentrouter client helper"
```

---

### Task 2: API Route `POST /api/tools/prompt-master/clarify`

**Files:**
- Create: `src/app/api/tools/prompt-master/clarify/route.ts`
- Test: `tests/api/prompt-master-clarify.test.ts`

**Interfaces:**
- Consumes: `callAgentRouterClarify`, `PROMPT_CATEGORIES` from Task 1, `checkRateLimit` from `src/lib/rate-limiter.ts`
- Produces: `POST` endpoint returning `{ success: true, questions: [...] }` or error JSON.

- [ ] **Step 1: Write the failing test for clarify API route**

```typescript
// tests/api/prompt-master-clarify.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/tools/prompt-master/clarify/route";
import { NextRequest } from "next/server";
import * as agentClient from "@/lib/agentrouter-client";

describe("POST /api/tools/prompt-master/clarify", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 400 if prompt is empty or too short", async () => {
    const req = new NextRequest("http://localhost:3000/api/tools/prompt-master/clarify", {
      method: "POST",
      body: JSON.stringify({ prompt: "ab", category: "coding" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("should return clarify questions on valid request", async () => {
    vi.spyOn(agentClient, "callAgentRouterClarify").mockResolvedValue({
      questions: [
        { id: "q1", question: "Framework gì?", options: ["React", "Vue"] }
      ]
    });

    const req = new NextRequest("http://localhost:3000/api/tools/prompt-master/clarify", {
      method: "POST",
      body: JSON.stringify({ prompt: "xây dựng web bán hàng", category: "coding" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.questions).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/prompt-master-clarify.test.ts`  
Expected: FAIL with route not found / export missing

- [ ] **Step 3: Implement `src/app/api/tools/prompt-master/clarify/route.ts`**

Extract client IP from headers (`x-forwarded-for` or `cf-connecting-ip`), call `checkRateLimit(ip, { limit: 15, windowMs: 3600000 })`, validate input, and call `callAgentRouterClarify`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/prompt-master-clarify.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/tools/prompt-master/clarify/route.ts tests/api/prompt-master-clarify.test.ts
git commit -m "feat(prompt-master): add clarify API route with rate limiting"
```

---

### Task 3: API Route `POST /api/tools/prompt-master/generate` (SSE Streaming)

**Files:**
- Create: `src/app/api/tools/prompt-master/generate/route.ts`
- Test: `tests/api/prompt-master-generate.test.ts`

**Interfaces:**
- Consumes: `callAgentRouterGenerateStream` from Task 1, `checkRateLimit` from `src/lib/rate-limiter.ts`
- Produces: `POST` endpoint returning `Response` with `Content-Type: text/event-stream`.

- [ ] **Step 1: Write the failing test for generate API route**

```typescript
// tests/api/prompt-master-generate.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/tools/prompt-master/generate/route";
import { NextRequest } from "next/server";
import * as agentClient from "@/lib/agentrouter-client";

describe("POST /api/tools/prompt-master/generate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return 400 if prompt is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/tools/prompt-master/generate", {
      method: "POST",
      body: JSON.stringify({ category: "coding" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should stream response with text/event-stream headers", async () => {
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("data: # Master Prompt\\n\\n"));
        controller.enqueue(encoder.encode("data: [DONE]\\n\\n"));
        controller.close();
      },
    });

    vi.spyOn(agentClient, "callAgentRouterGenerateStream").mockResolvedValue(readable);

    const req = new NextRequest("http://localhost:3000/api/tools/prompt-master/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "xây dựng api auth jwt", category: "coding" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/prompt-master-generate.test.ts`  
Expected: FAIL with route not found

- [ ] **Step 3: Implement `src/app/api/tools/prompt-master/generate/route.ts`**

Apply rate limit (10 req/h), validate input length, delegate to `callAgentRouterGenerateStream`, and return SSE Response.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/prompt-master-generate.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/tools/prompt-master/generate/route.ts tests/api/prompt-master-generate.test.ts
git commit -m "feat(prompt-master): add streaming generate API route"
```

---

### Task 4: UI Sub-Components (Input, Clarify, Result & Codex CTA)

**Files:**
- Create: `src/components/prompt-master/PromptInputStep.tsx`
- Create: `src/components/prompt-master/ClarifyStep.tsx`
- Create: `src/components/prompt-master/ResultStep.tsx`
- Create: `src/components/prompt-master/CodexCtaBanner.tsx`
- Test: `tests/ui/prompt-master-components.test.tsx`

**Interfaces:**
- Produces: Modular, independently testable UI components with standard dark slate theme matching `/codex`.

- [ ] **Step 1: Write the failing tests for UI components**

```typescript
// tests/ui/prompt-master-components.test.tsx
import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import CodexCtaBanner from "@/components/prompt-master/CodexCtaBanner";
import PromptInputStep from "@/components/prompt-master/PromptInputStep";

describe("Prompt Master UI Components", () => {
  it("should render CodexCtaBanner with link to /codex", () => {
    render(<CodexCtaBanner />);
    const link = screen.getByRole("link", { name: /Nạp Codex API Credit/i });
    expect(link.getAttribute("href")).toBe("/codex");
  });

  it("should render PromptInputStep with textarea and category options", () => {
    render(
      <PromptInputStep
        prompt=""
        category="coding"
        onPromptChange={() => {}}
        onCategoryChange={() => {}}
        onSubmit={() => {}}
        isLoading={false}
      />
    );
    expect(screen.getByPlaceholderText(/Nhập câu prompt/i)).toBeDefined();
    expect(screen.getByText(/Lập trình & Cursor/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/prompt-master-components.test.tsx`  
Expected: FAIL with module not found

- [ ] **Step 3: Implement all 4 components in `src/components/prompt-master/`**

Write clean, responsive components with Tailwind CSS, Lucide icons, glassmorphism borders, and accessible inputs.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/prompt-master-components.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/prompt-master/ tests/ui/prompt-master-components.test.tsx
git commit -m "feat(prompt-master): add modular UI components and Codex CTA banner"
```

---

### Task 5: Main Client Orchestrator, Page Route & Navigation Header

**Files:**
- Create: `src/components/prompt-master/PromptMasterClient.tsx`
- Create: `src/app/tools/prompt-master/page.tsx`
- Modify: `src/app/page.tsx` (Add a quick access badge/link to Master Prompt Generator)
- Test: `tests/ui/prompt-master-client.test.tsx`

**Interfaces:**
- Consumes: Components from Task 4, API routes from Tasks 2 & 3.
- Produces: Complete page at `/tools/prompt-master`.

- [ ] **Step 1: Write the failing test for PromptMasterClient workflow**

```typescript
// tests/ui/prompt-master-client.test.tsx
import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import PromptMasterClient from "@/components/prompt-master/PromptMasterClient";

describe("PromptMasterClient", () => {
  it("should render initial step with title and input", () => {
    render(<PromptMasterClient />);
    expect(screen.getByText(/Tạo Master Prompt Chuẩn Quốc Tế/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/prompt-master-client.test.tsx`  
Expected: FAIL with missing component

- [ ] **Step 3: Implement `PromptMasterClient.tsx`, `page.tsx`, and add entry link to `src/app/page.tsx`**

Connect SSE event reader with smooth live typing display, error state handling, copy to clipboard, and category switching.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/prompt-master-client.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/prompt-master/PromptMasterClient.tsx src/app/tools/prompt-master/page.tsx src/app/page.tsx tests/ui/prompt-master-client.test.tsx
git commit -m "feat(prompt-master): integrate page, client coordinator, and home link"
```

---

### Task 6: Full Suite Regression Verification & End-to-End Smoke Test

**Files:**
- Test: All tests in `tests/`
- Command: `npm run test` and `npm run build`

- [ ] **Step 1: Run complete test suite**

Run: `npm run test`  
Expected: All tests pass (0 failures across existing and new test suites).

- [ ] **Step 2: Run Next.js production build check**

Run: `npm run build`  
Expected: Build succeeds with 0 TypeScript and Next.js compilation errors.

- [ ] **Step 3: Commit final verification snapshot**

```bash
git commit --allow-empty -m "chore(prompt-master): verify build and full test suite passes"
```
