import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PromptMasterClient from "@/components/prompt-master/PromptMasterClient";
import PromptMasterPage, { metadata } from "@/app/tools/prompt-master/page";

describe("PromptMasterClient & Page Route", () => {
  it("renders PromptMasterClient with header, step wizard, and CTA", () => {
    const html = renderToStaticMarkup(React.createElement(PromptMasterClient));
    expect(html).toContain("Master Prompt Generator");
    expect(html).toContain("Chọn lĩnh vực bạn muốn tối ưu");
    expect(html).toContain("Thử nghiệm Master Prompt này trên Codex API");
  });

  it("renders page component with title metadata", () => {
    expect(metadata.title).toBeDefined();
    expect(String(metadata.title)).toContain("Master Prompt");

    const html = renderToStaticMarkup(React.createElement(PromptMasterPage));
    expect(html).toContain("Master Prompt Generator");
  });
});
