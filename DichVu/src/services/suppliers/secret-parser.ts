/**
 * Smart Secret Parser for Supplier Delivery Messages.
 * Extracts claim links, account credentials (user|pass), activation keys, and notes
 * from raw bot delivery messages.
 */

export interface ParsedSecret {
  type: "link" | "credentials" | "key" | "text";
  content: string;
  instructions?: string;
  rawText: string;
  isNoticeOnly?: boolean;
}

function cleanPart(val: string): string {
  return val.trim().replace(/^[`'"]+|[`'"]+$/g, "");
}

export function extractDeliveredSecret(rawText: string): ParsedSecret {
  if (!rawText || !rawText.trim()) {
    return { type: "text", content: "", rawText: "" };
  }

  const text = rawText.trim();

  // 1. Check for invite/claim URLs (Google Family, Gemini, Canva, Office, Drive...)
  // Exclude internal Telegram links (t.me, notificationshop, etc.)
  const linkMatches = text.match(/https?:\/\/[^\s`"')]+/gi);
  if (linkMatches && linkMatches.length > 0) {
    const externalLinks = linkMatches.filter(
      (url) => !url.includes("t.me/") && !url.includes("telegram.me/")
    );
    if (externalLinks.length > 0) {
      return {
        type: "link",
        content: externalLinks[0],
        instructions: text,
        rawText: text,
      };
    }
  }

  // 2. Check for email + Password label on same line (e.g. `user@domain.com  Password:  pass123`)
  const emailPasswordMatch = text.match(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:Password|Pass|Mật\s*khẩu):\s*`?([^\s\n\r`]+)`?/i
  );
  if (emailPasswordMatch) {
    return {
      type: "credentials",
      content: `${cleanPart(emailPasswordMatch[1])}|${cleanPart(emailPasswordMatch[2])}`,
      instructions: text,
      rawText: text,
    };
  }

  // 3. Check for pipe-separated credentials: email@domain.com|password or user|password
  const pipeMatch = text.match(
    /`?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*\|\s*([^`\r\n\s]+)`?/
  );
  if (pipeMatch) {
    const u = cleanPart(pipeMatch[1]);
    const p = cleanPart(pipeMatch[2]);
    return {
      type: "credentials",
      content: `${u}|${p}`,
      instructions: text,
      rawText: text,
    };
  }

  // 4. Check for labeled credentials: "Tài khoản: ... \nMật khẩu: ..."
  // Exclude descriptive labels like "Loại tài khoản:", "Tên tài khoản:"
  const labeledMatch = text.match(
    /(?:(?<!(?:Loại|Tên|Dạng)\s*)(?:Tài\s*khoản|Email|Username|User)):\s*`?([^\n\r`]+)`?[\s\S]*?(?:Mật\s*khẩu|Pass|Password):\s*`?([^\n\r`]+)`?/i
  );
  if (labeledMatch && labeledMatch[1] && labeledMatch[2]) {
    const u = cleanPart(labeledMatch[1]);
    const p = cleanPart(labeledMatch[2]);
    // Guard against descriptions being mistaken for usernames
    if (!u.toLowerCase().includes("riêng tư") && !u.toLowerCase().includes("cá nhân")) {
      return {
        type: "credentials",
        content: `${u}|${p}`,
        instructions: text,
        rawText: text,
      };
    }
  }

  // 4. Check for License Key: e.g. "Key: XXXXX-XXXXX" or "Mã kích hoạt: XXXXX"
  const keyMatch = text.match(
    /(?:Key|Mã\s*(?:kích\s*hoạt|key|bản\s*quyền|thẻ)):\s*`?([A-Z0-9-]{8,})`?/i
  );
  if (keyMatch && keyMatch[1]) {
    return {
      type: "key",
      content: cleanPart(keyMatch[1]),
      instructions: text,
      rawText: text,
    };
  }

  // 5. Guard against error messages, balance alerts, or failure notices being treated as delivered secrets
  const isErrorNotice =
    /(?:số dư|ví)[^.]*không đủ|thất bại|không đủ để (?:mua|thanh toán|thực hiện)|nạp thêm tiền|hết hàng|error|failed|❌/i.test(
      text
    );
  if (isErrorNotice) {
    return {
      type: "text",
      content: "",
      instructions: text,
      rawText: text,
      isNoticeOnly: true,
    };
  }

  // 6. Check if message is merely a delivery notification pointing to an attached file or video
  const isNotice = /(?:nằm trong file|file\s*(?:txt|đính kèm)|video\s*kiểm\s*tra)/i.test(text);
  if (isNotice) {
    return {
      type: "text",
      content: "",
      instructions: text,
      rawText: text,
      isNoticeOnly: true,
    };
  }

  // 6. Fallback: clean trimmed text
  return {
    type: "text",
    content: text,
    rawText: text,
  };
}
