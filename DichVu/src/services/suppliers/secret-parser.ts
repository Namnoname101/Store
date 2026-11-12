/**
 * Smart Secret Parser for Supplier Delivery Messages.
 * Extracts claim links, account credentials (user|pass), activation keys, and notes
 * from raw bot delivery messages.
 *
 * Guarantees:
 * 1. Supplier wholesale cost, wallet balance, and order codes are NEVER leaked to customers.
 * 2. Robust multi-pattern extraction for credentials (space-separated, pipe-separated, colon-separated, labeled).
 * 3. Sanitized instructions for customer guidance.
 */

export interface ParsedSecret {
  type: "link" | "credentials" | "key" | "text";
  content: string;
  instructions?: string;
  rawText: string;
  isNoticeOnly?: boolean;
  deliveredKeys: string[];
}

function cleanPart(val: string): string {
  if (!val) return "";
  return val.trim().replace(/^[`'"]+|[`'"]+$/g, "");
}

/**
 * Sanitizes instructions by removing any supplier sensitive info:
 * wholesale price, wallet balance, supplier order ID, and supplier branding.
 */
export function sanitizeInstructions(text: string, extractedCredentials: string[] = []): string {
  if (!text) return "";

  const lines = text.split("\n");
  const sanitizedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Remove horizontal rules / decorative dividers
    if (/^[━─=\-_*~]{4,}$/.test(trimmed)) {
      continue;
    }

    // Skip supplier billing / order metadata lines
    if (
      /(?:mã đơn|mã đơn hàng|mã giao dịch|order id|trans id|🧾)/i.test(trimmed) ||
      /(?:thanh toán|giá tiền|giá vốn|số tiền|💵)/i.test(trimmed) ||
      /(?:số dư còn lại|số dư ví|số dư|ví của bạn|💰)/i.test(trimmed) ||
      /(?:đơn hàng thành công|mua hàng thành công|✅)/i.test(trimmed) ||
      /(?:cảm ơn bạn đã mua|cảm ơn quý khách|thanks for purchasing|chúc bạn một ngày tốt lành)/i.test(trimmed) ||
      /(?:t\.me\/|telegram\.me\/|@\w+_bot)/i.test(trimmed) ||
      /(?:mô tả lúc bán|định dạng: email|loại tài khoản: dùng riêng tư)/i.test(trimmed) ||
      /(?:bảo hành \d+\s*(?:ngày|tháng))/i.test(trimmed)
    ) {
      continue;
    }

    // Skip section headers that only announce the account
    if (/^(?:🔐|🔑)?\s*\**THÔNG TIN TÀI KHOẢN\**\s*:?$/i.test(trimmed)) {
      continue;
    }

    // Skip lines that contain the extracted credentials themselves
    let isCredentialLine = false;
    for (const cred of extractedCredentials) {
      const parts = cred.split("|");
      const u = parts[0];
      const p = parts[1];
      if ((u && trimmed.includes(u)) || (p && trimmed === p)) {
        isCredentialLine = true;
        break;
      }
    }
    if (isCredentialLine) {
      continue;
    }

    // Skip standalone list index lines like "1)" or "1."
    if (/^\d+\)\s*$/i.test(trimmed) || /^\d+\.\s*$/i.test(trimmed)) {
      continue;
    }

    sanitizedLines.push(line);
  }

  // Remove consecutive empty lines and trim
  return sanitizedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Extracts all account credentials (user|pass) from text.
 * Returns array of "username|password" (or "username|password|2fa") strings.
 */
export function extractAccountsFromText(text: string): string[] {
  if (!text || !text.trim()) return [];

  const results: string[] = [];
  const seen = new Set<string>();

  function addResult(u?: string, p?: string, extra?: string) {
    if (!u || !p) return;
    const cleanU = cleanPart(u);
    const cleanP = cleanPart(p);
    if (!cleanU || !cleanP) return;

    // Don't mistake descriptive labels or headers for credentials
    if (/^(?:dùng riêng tư|cá nhân|email \+ mật khẩu|full date|30 ngày|bảo hành|mô tả|thông tin)/i.test(cleanU)) return;
    if (/^(?:pass|password|mật khẩu|mk)$/i.test(cleanP)) return;

    const key = extra ? `${cleanU}|${cleanP}|${cleanPart(extra)}` : `${cleanU}|${cleanP}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(key);
    }
  }

  // Format 1: Explicit labeled fields across lines:
  // (Tài khoản / Email / TK: ...) followed by (Mật khẩu / Pass / MK: ...)
  const labeledRegex = /(?:(?<!(?:Loại|Tên|Dạng|Định dạng)\s*)(?:Tài\s*khoản|Email|Username|User|TK)):\s*`?([^\n\r`|]+)`?[\s\S]*?(?:Mật\s*khẩu|Pass|Password|MK):\s*`?([^\n\r`|]+)`?/gi;
  let match: RegExpExecArray | null;
  while ((match = labeledRegex.exec(text)) !== null) {
    addResult(match[1], match[2]);
  }
  if (results.length > 0) {
    return results;
  }

  // Format 2: Header block "THÔNG TIN TÀI KHOẢN" or similar:
  // e.g. 1) `user@outlook.com 1234567` or `user@outlook.com|1234567`
  const headerBlockMatch = text.match(/(?:THÔNG TIN TÀI KHOẢN|DANH SÁCH TÀI KHOẢN|ACCOUNT INFO)[\s\S]*?(?:━{3,}|$)/i);
  const blockToSearch = headerBlockMatch ? headerBlockMatch[0] : null;

  // Regex A: Email with same-line separator (space, pipe, colon, tab) followed by password
  // Note: [^\S\r\n] matches horizontal whitespace only (spaces, tabs), preventing matching across newlines!
  const emailPassRegex = /`?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})[^\S\r\n]*[:|\t ][^\S\r\n]*([^\s`\r\n|]+)(?:[^\S\r\n]*\|[^\S\r\n]*([^\s`\r\n]+))?`?/g;

  if (blockToSearch) {
    while ((match = emailPassRegex.exec(blockToSearch)) !== null) {
      addResult(match[1], match[2], match[3]);
    }
    if (results.length > 0) {
      return results;
    }
  }

  // Format 3: Email with same-line separator across entire text
  while ((match = emailPassRegex.exec(text)) !== null) {
    addResult(match[1], match[2], match[3]);
  }
  if (results.length > 0) {
    return results;
  }

  // Format 4: Generic non-email user|password (e.g. `username123|password456`)
  const genericPipeRegex = /`?([a-zA-Z0-9._-]{3,40})[^\S\r\n]*\|[^\S\r\n]*([^\s`\r\n|]{4,60})`?/g;
  while ((match = genericPipeRegex.exec(text)) !== null) {
    const u = match[1].toLowerCase();
    if (!["email", "pass", "password", "loại", "ngày", "http", "https", "định dạng"].includes(u)) {
      addResult(match[1], match[2]);
    }
  }

  return results;
}

export function extractDeliveredSecret(rawText: string): ParsedSecret {
  if (!rawText || !rawText.trim()) {
    return { type: "text", content: "", rawText: "", deliveredKeys: [] };
  }

  const text = rawText.trim();

  // 1. Guard against error messages, balance alerts, or failure notices
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
      deliveredKeys: [],
    };
  }

  // 2. Check for invite/claim URLs (Google Family, Gemini, Canva, Office, Drive...)
  // Exclude internal Telegram links (t.me, notificationshop, etc.)
  const linkMatches = text.match(/https?:\/\/[^\s`"')]+/gi);
  if (linkMatches && linkMatches.length > 0) {
    const externalLinks = linkMatches.filter(
      (url) => !url.includes("t.me/") && !url.includes("telegram.me/") && !url.includes("facebook.com/")
    );
    if (externalLinks.length > 0) {
      return {
        type: "link",
        content: externalLinks[0],
        instructions: sanitizeInstructions(text, [externalLinks[0]]),
        rawText: text,
        deliveredKeys: externalLinks,
      };
    }
  }

  // 3. Extract account credentials (user|pass)
  const accounts = extractAccountsFromText(text);
  if (accounts.length > 0) {
    return {
      type: "credentials",
      content: accounts.join("\n"),
      instructions: sanitizeInstructions(text, accounts),
      rawText: text,
      deliveredKeys: accounts,
    };
  }

  // 4. Check for License Key: e.g. "Key: XXXXX-XXXXX" or "Mã kích hoạt: XXXXX" or sk-...
  const keyMatch =
    text.match(/(?:Key|Mã\s*(?:kích\s*hoạt|key|bản\s*quyền|thẻ)):\s*`?([A-Z0-9-]{8,})`?/i) ||
    text.match(/`?(sk-[a-zA-Z0-9_-]{20,})`?/);

  if (keyMatch && keyMatch[1]) {
    const key = cleanPart(keyMatch[1]);
    return {
      type: "key",
      content: key,
      instructions: sanitizeInstructions(text, [key]),
      rawText: text,
      deliveredKeys: [key],
    };
  }

  // 5. Check if message is merely a delivery notification pointing to an attached file or video
  const isNotice = /(?:nằm trong file|file\s*(?:txt|đính kèm)|video\s*kiểm\s*tra)/i.test(text);
  if (isNotice) {
    return {
      type: "text",
      content: "",
      instructions: text,
      rawText: text,
      isNoticeOnly: true,
      deliveredKeys: [],
    };
  }

  // 6. Fallback: sanitize the text so wholesale prices & balances are NEVER leaked
  const sanitizedFallback = sanitizeInstructions(text);
  return {
    type: "text",
    content: sanitizedFallback,
    rawText: text,
    deliveredKeys: sanitizedFallback ? [sanitizedFallback] : [],
  };
}
