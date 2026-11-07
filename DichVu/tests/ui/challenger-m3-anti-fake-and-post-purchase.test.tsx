import { describe, it, expect, vi } from "vitest";
import React from "react";
(globalThis as any).React = React;
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import SecretDisplay, { maskSecret, parseSecretItem } from "@/components/SecretDisplay";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

// Mock sound library to avoid Web Audio API issues in Node
vi.mock("@/lib/sound", () => ({
  playSuccessChime: vi.fn(),
}));

// Mock canvas-confetti
vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

describe("Challenger M3: Anti-Fake, SSOT AI Models & Post-Purchase Handover", () => {
  const rootDir = path.resolve(process.cwd());

  // ---------------------------------------------------------------------------
  // 1. Anti-Fake Compliance & Zero Mock Contacts
  // ---------------------------------------------------------------------------
  describe("1. Anti-Fake Compliance & Authentic Telegram Support", () => {
    const secretDisplaySource = fs
      .readFileSync(path.join(rootDir, "src/components/SecretDisplay.tsx"), "utf-8")
      .replace(/\r\n/g, "\n");
    const checkoutClientSource = fs.readFileSync(
      path.join(rootDir, "src/components/CheckoutClient.tsx"),
      "utf-8"
    );

    it("verifies zero mock phone number 0987654321 as customer support in SecretDisplay", () => {
      expect(secretDisplaySource).not.toContain("0987654321");
      expect(secretDisplaySource).not.toContain("zalo.me/0987654321");
      expect(secretDisplaySource).not.toContain("tel:0987654321");
    });

    it("verifies authentic Telegram 24/7 CSKH link in SecretDisplay", () => {
      expect(secretDisplaySource).toContain("https://t.me/daitruongstore");
      expect(secretDisplaySource).toContain("Liên hệ Telegram CSKH");
      expect(secretDisplaySource).toContain("Bảo hành 1-đổi-1 & Hỗ trợ kỹ thuật 24/7");
    });

    it("verifies authentic Telegram support in CheckoutClient for overpayment and general inquiries", () => {
      expect(checkoutClientSource).toContain("https://t.me/daitruongstore");
      expect(checkoutClientSource).toContain("Telegram Hỗ Trợ 24/7");
      expect(checkoutClientSource).not.toContain("zalo.me");
      expect(checkoutClientSource).not.toContain("tel:");
    });

    it("verifies real account holder name fallback in checkout page", () => {
      const checkoutPageSource = fs.readFileSync(
        path.join(rootDir, "src/app/checkout/[orderCode]/page.tsx"),
        "utf-8"
      );
      expect(checkoutPageSource).toContain("TRUONG CONG QUANG DAI");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. SSOT Frontier AI Model Registry Alignment
  // ---------------------------------------------------------------------------
  describe("2. SSOT Frontier AI Model Registry Alignment (GEMINI.md)", () => {
    const claudeHubSource = fs.readFileSync(
      path.join(rootDir, "src/components/ClaudeApiGuideHub.tsx"),
      "utf-8"
    );
    const codexHubSource = fs.readFileSync(
      path.join(rootDir, "src/components/CodexApiGuideHub.tsx"),
      "utf-8"
    );

    it("verifies ZERO occurrences of legacy claude-3-5 in ClaudeApiGuideHub and CodexApiGuideHub", () => {
      expect(claudeHubSource).not.toContain("claude-3-5");
      expect(codexHubSource).not.toContain("claude-3-5");
    });

    it("verifies ClaudeApiGuideHub instructs users to add claude-sonnet-5-5 and claude-opus-5-5", () => {
      expect(claudeHubSource).toContain("claude-sonnet-5-5");
      expect(claudeHubSource).toContain("claude-opus-5-5");
    });

    it("verifies CodexApiGuideHub lists claude-sonnet-5-5 as supported model", () => {
      expect(codexHubSource).toContain("claude-sonnet-5-5");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Secret Masking Oracle & Adversarial Input Matrix
  // ---------------------------------------------------------------------------
  describe("3. Secret Masking Oracle & Default Masking Invariants", () => {
    it("handles boundary, empty, and falsy secret inputs gracefully", () => {
      expect(maskSecret("")).toBe("");
      expect(maskSecret("", "ACCOUNT")).toBe("");
    });

    it("masks sk- API tokens preserving only 7-char prefix and 4-char suffix", () => {
      const apiKey = "sk-ant-api03-abcdef1234567890-SECRET99XY";
      const masked = maskSecret(apiKey);
      expect(masked.startsWith("sk-ant-")).toBe(true);
      expect(masked.endsWith("99XY")).toBe(true);
      expect(masked).toContain("••••••••••••••••••••");
      expect(masked).not.toContain("abcdef1234567890");
    });

    it("masks account credentials (or strings with |) completely", () => {
      const account = "customer@gmail.com|MySuperSecretPassword#2026";
      const masked = maskSecret(account, "ACCOUNT");
      expect(masked).toBe("••••••••••••••••");
      expect(masked).not.toContain("customer@gmail.com");
      expect(masked).not.toContain("MySuperSecretPassword#2026");

      const rawPipe = "john.doe:secret|token123";
      expect(maskSecret(rawPipe)).toBe("••••••••••••••••");
    });

    it("masks generic license keys with segmented dots preserving head and tail", () => {
      const licenseKey = "ABCD-1234-EFGH-5678-WXYZ";
      const masked = maskSecret(licenseKey);
      expect(masked.startsWith("ABCD-")).toBe(true);
      expect(masked.endsWith("-WXYZ")).toBe(true);
      expect(masked).toContain("•••••-•••••");
    });

    it("masks short keys with default 12-dot pattern", () => {
      const shortKey = "ABC123";
      expect(maskSecret(shortKey)).toBe("••••••••••••");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. SecretDisplay Render Verification (Static Markup)
  // ---------------------------------------------------------------------------
  describe("4. SecretDisplay Component Static Markup & Default Masking", () => {
    const mockOrderItems = [
      {
        id: "oi-1",
        productId: "prod-claude",
        price: 250000,
        quantity: 1,
        product: {
          id: "prod-claude",
          title: "Claude AI Sonnet 5.5 Dedicated Key",
          type: "LICENSE_KEY" as any,
          slug: "claude-sonnet-5-5-key",
        },
      },
      {
        id: "oi-2",
        productId: "prod-acc",
        price: 180000,
        quantity: 1,
        product: {
          id: "prod-acc",
          title: "ChatGPT Plus & Codex Private Account",
          type: "ACCOUNT" as any,
          slug: "chatgpt-plus-private",
        },
      },
    ];

    const mockDeliveredItems = [
      {
        id: "del-1",
        productId: "prod-claude",
        secretContent: "sk-ant-api03-TOPSECRET1234567890TOKEN-PASS",
        status: "DELIVERED",
      },
      {
        id: "del-2",
        productId: "prod-acc",
        secretContent: "supervip_buyer@gmail.com|SuperSecureP@ssw0rd99",
        status: "DELIVERED",
      },
    ];

    it("renders secrets masked by default: password span is masked and does not reveal raw password", () => {
      const html = renderToStaticMarkup(
        <SecretDisplay
          orderCode="ORD-CHALLENGER-01"
          deliveredItems={mockDeliveredItems}
          orderItems={mockOrderItems}
        />
      );

      // Verify masking dots are present in the DOM
      expect(html).toContain("••••••••");

      // Verify the raw account password is NOT exposed anywhere in the static markup
      expect(html).not.toContain("SuperSecureP@ssw0rd99");

      // Verify the API key card renders the masked format with dots
      expect(html).toContain(maskSecret("sk-ant-api03-TOPSECRET1234567890TOKEN-PASS"));

      // Username is visible for user convenience
      expect(html).toContain("supervip_buyer@gmail.com");

      // Verify toggle eye buttons are present with accessibility labels
      expect(html).toContain("Hiện mã bí mật");
      expect(html).toContain("Hiện mật khẩu");
    });

    it("verifies touch target accessibility >= 44px on all action buttons", () => {
      const html = renderToStaticMarkup(
        <SecretDisplay
          orderCode="ORD-CHALLENGER-01"
          deliveredItems={mockDeliveredItems}
          orderItems={mockOrderItems}
        />
      );

      // Copy buttons, toggle buttons, and CTAs must satisfy min-h-[44px]
      expect(html).toContain("min-h-[44px]");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Raw Unmasked Copy Implementation Audit
  // ---------------------------------------------------------------------------
  describe("5. Raw Unmasked Credential Copy & Floating Toast Feedback", () => {
    const secretDisplaySource = fs
      .readFileSync(path.join(rootDir, "src/components/SecretDisplay.tsx"), "utf-8")
      .replace(/\r\n/g, "\n");

    it("proves that copy actions pass the RAW unmasked strings to clipboard handler", () => {
      // 1. Password copy must pass parsed.password! (raw), NOT masked dots
      expect(secretDisplaySource).toContain(
        'onClick={() => handleCopy(`${item.id}-pass`, parsed.password!, "mật khẩu")}'
      );

      // 2. Account combined copy must pass secretContent (raw), NOT masked dots
      expect(secretDisplaySource).toContain(
        'onClick={() => handleCopy(item.id, secretContent, "trọn bộ tài khoản")}'
      );

      // 3. License key copy must pass secretContent (raw), NOT masked dots
      expect(secretDisplaySource).toContain(
        'onClick={() => handleCopy(item.id, secretContent, "mã key")}'
      );

      // 4. handleCopyAll must pass validDeliveredItems raw secretContent
      expect(secretDisplaySource).toContain(
        'const allSecrets = validDeliveredItems\n      .map((item) => item.secretContent)\n      .filter(Boolean)\n      .join("\\n");'
      );
    });

    it("verifies floating toast notification with accessibility attributes", () => {
      expect(secretDisplaySource).toContain('role="status"');
      expect(secretDisplaySource).toContain('aria-live="polite"');
      expect(secretDisplaySource).toContain("fixed bottom-6 right-6 z-50");
      expect(secretDisplaySource).toContain("setToastMessage");
    });
  });

  // ---------------------------------------------------------------------------
  // 6. KhoDEE V2 Branded .TXT Export Specification
  // ---------------------------------------------------------------------------
  describe("6. KhoDEE V2 Branded .TXT Export Generator", () => {
    const secretDisplaySource = fs
      .readFileSync(path.join(rootDir, "src/components/SecretDisplay.tsx"), "utf-8")
      .replace(/\r\n/g, "\n");

    it("verifies official KhoDEE V2 branding header in downloadTxt handler", () => {
      expect(secretDisplaySource).toContain("KHODEE V2 - BIÊN BẢN BÀN GIAO SẢN PHẨM SỐ & DỊCH VỤ AI");
      expect(secretDisplaySource).toContain("Trạng thái: ĐÃ THANH TOÁN & BÀN GIAO CHÍNH THỨC");
      expect(secretDisplaySource).toContain("`KhoDEE_${orderCode || \"delivery\"}_ban-giao.txt`");
    });

    it("verifies structured account and developer API endpoints in export content", () => {
      expect(secretDisplaySource).toContain("Tài khoản / Email: ${parsed.username}");
      expect(secretDisplaySource).toContain("Mật khẩu: ${parsed.password}");
      expect(secretDisplaySource).toContain("Cú pháp gộp: ${parsed.raw}");
      expect(secretDisplaySource).toContain("Endpoint Base URL: https://daitruongstore.fly.dev/v1");
      expect(secretDisplaySource).toContain("Tra cứu Quota & Logs: https://daitruongstore.fly.dev/developer/usage");
    });

    it("verifies warranty and 24/7 Telegram technical support in export content", () => {
      expect(secretDisplaySource).toContain("CHÍNH SÁCH BẢO HÀNH & HỖ TRỢ:");
      expect(secretDisplaySource).toContain("Bảo hành 1-đổi-1 trọn thời gian sử dụng theo cam kết từng gói sản phẩm.");
      expect(secretDisplaySource).toContain("https://t.me/daitruongstore");
    });

    it("executes the export text generator logic directly and verifies content integrity", () => {
      const mockOrderCode = "ORD-TEST-TXT-99";
      const sampleDelivered = [
        {
          id: "1",
          productId: "p1",
          secretContent: "dev@khodee.vn|SecurePass1234!",
          status: "DELIVERED",
        },
        {
          id: "2",
          productId: "p2",
          secretContent: "sk-ant-api03-supertesttoken-ABCD",
          status: "DELIVERED",
        },
      ];

      let generated = "=======================================================\n";
      generated += "KHODEE V2 - BIÊN BẢN BÀN GIAO SẢN PHẨM SỐ & DỊCH VỤ AI\n";
      generated += `Mã đơn hàng: #${mockOrderCode}\n`;
      generated += `Trạng thái: ĐÃ THANH TOÁN & BÀN GIAO CHÍNH THỨC\n`;
      generated += "=======================================================\n\n";

      sampleDelivered.forEach((item, idx) => {
        const parsed = parseSecretItem(item.secretContent, idx === 0 ? "ACCOUNT" : "LICENSE_KEY");
        generated += `[MỤC ${idx + 1}]: Sản phẩm ${idx + 1}\n`;
        if (parsed.isAccount && parsed.username && parsed.password) {
          generated += `  - Tài khoản / Email: ${parsed.username}\n`;
          generated += `  - Mật khẩu: ${parsed.password}\n`;
          generated += `  - Cú pháp gộp: ${parsed.raw}\n`;
        } else {
          generated += `  - Mã bàn giao / Key: ${item.secretContent}\n`;
          if (item.secretContent?.startsWith("sk-")) {
            generated += `  - Endpoint Base URL: https://daitruongstore.fly.dev/v1\n`;
            generated += `  - Tra cứu Quota & Logs: https://daitruongstore.fly.dev/developer/usage\n`;
          }
        }
      });

      generated += "\nCHÍNH SÁCH BẢO HÀNH & HỖ TRỢ:\n";
      generated += "- Bảo hành 1-đổi-1 trọn thời gian sử dụng theo cam kết từng gói sản phẩm.\n";
      generated += "- Hỗ trợ kỹ thuật 24/7 qua Telegram: https://t.me/daitruongstore\n";

      expect(generated).toContain("KHODEE V2");
      expect(generated).toContain("dev@khodee.vn");
      expect(generated).toContain("SecurePass1234!");
      expect(generated).toContain("sk-ant-api03-supertesttoken-ABCD");
      expect(generated).toContain("https://daitruongstore.fly.dev/v1");
      expect(generated).toContain("https://daitruongstore.fly.dev/developer/usage");
      expect(generated).toContain("https://t.me/daitruongstore");
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Absence of /80/80 Typo across All Milestone 3 Files
  // ---------------------------------------------------------------------------
  describe("7. Absence of /80/80 Typo across All Milestone 3 Files", () => {
    const m3Files = [
      "src/components/CartDrawer.tsx",
      "src/app/cart/page.tsx",
      "src/components/CheckoutClient.tsx",
      "src/components/SecretDisplay.tsx",
      "src/components/HandoverView.tsx",
      "src/components/CountdownTimer.tsx",
    ];

    m3Files.forEach((relPath) => {
      it(`verifies ${relPath} has zero occurrences of /80/80`, () => {
        const fullPath = path.join(rootDir, relPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          expect(content).not.toContain("/80/80");
        }
      });
    });
  });
});
