import { describe, it, expect } from "vitest";
import { resolveProductInstruction, PRODUCT_GUIDES } from "../../src/lib/product-guides";
import ClaudeApiGuideHub from "../../src/components/ClaudeApiGuideHub";

describe("Claude API & Codex Guide Hub", () => {
  it("resolves claude-api instructions correctly with all 5 platform steps", () => {
    const guide = resolveProductInstruction({
      slug: "claude-api-10usd",
      title: "API Claude 10$ Quota",
      type: "LICENSE_KEY",
      rawSecret: "sk-ant-test-key-123",
    });

    expect(guide).toBeDefined();
    expect(guide.title).toContain("API Claude");
    expect(guide.docsUrl).toBe("/huong-dan/api-claude");
    expect(guide.steps.length).toBeGreaterThanOrEqual(5);

    // Verify presence of all key platforms
    const stepsText = JSON.stringify(guide.steps);
    expect(stepsText).toContain("VS Code & Claude Code CLI");
    expect(stepsText).toContain("Claude AI Desktop");
    expect(stepsText).toContain("OpenClaw");
    expect(stepsText).toContain("Open Design Gateway");
    expect(stepsText).toContain("Cursor");
  });

  it("resolves codex packages with docsUrl pointing to guide hub", () => {
    const guide = resolveProductInstruction({
      slug: "codex-credit-10usd",
      title: "Gói Codex 10$ Credit",
      type: "LICENSE_KEY",
      rawSecret: "sk-modelapi-123",
    });

    expect(guide).toBeDefined();
    expect(guide.docsUrl).toBe("/huong-dan/api-claude");
  });

  it("exports ClaudeApiGuideHub as a React functional component", () => {
    expect(ClaudeApiGuideHub).toBeDefined();
    expect(typeof ClaudeApiGuideHub).toBe("function");
  });
});
