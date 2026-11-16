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
      /(?:mã đơn|mã đơn hàng|mã giao dịch|order id|trans id|order\s*#?\d+|đơn\s*(?:hàng)?\s*#?\d*|🧾)/i.test(trimmed) ||
      /(?:thanh toán|giá tiền|giá vốn|số tiền|💵)/i.test(trimmed) ||
      /(?:số dư còn lại|số dư ví|số dư|ví của bạn|💰)/i.test(trimmed) ||
      /(?:đơn hàng.*thành công|mua hàng.*thành công|thành công!|✅|🎉)/i.test(trimmed) ||
      /(?:cảm ơn bạn đã mua|cảm ơn quý khách|thanks for purchasing|chúc bạn một ngày tốt lành)/i.test(trimmed) ||
      /(?:t\.me\/|telegram\.me\/|@\w+_bot|@\w{4,}|nhắn\s*tin\s*trực\s*tiếp\s*admin)/i.test(trimmed) ||
      /(?:mô tả lúc bán|định dạng: email|loại tài khoản: dùng riêng tư)/i.test(trimmed) ||
      /(?:vui\s*lòng\s*lưu\s*lại\s*thông\s*tin)/i.test(trimmed) ||
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
      if ((u && trimmed.includes(u)) || (p && trimmed.includes(p))) {
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
 * Checks if a URL is merely a general portal, homepage, or utility link (like login portal or 2fa.live)
 * rather than a genuine single-use claim link or team invite.
 */
export function isUtilityOrNonClaimUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();

  // Internal / Social / Messenger links
  if (lower.includes("t.me/") || lower.includes("telegram.me/") || lower.includes("facebook.com/") || lower.includes("fb.com/")) {
    return true;
  }

  // 2FA TOTP portals (convenience tools for customers to get 6-digit OTPs)
  if (lower.includes("2fa.live") || lower.includes("2fa.online") || lower.includes("authenticator")) {
    return true;
  }

  // Login homepages and portals (these accompany account deliveries, they are NOT the delivery itself)
  if (
    lower.includes("chatgpt.com") ||
    lower.includes("openai.com") ||
    lower.includes("netflix.com") ||
    lower.includes("spotify.com") ||
    lower.includes("adobe.com")
  ) {
    return true;
  }

  // Google links (ignore general login/gmail/accounts, only accept Google Family invite)
  if (lower.includes("google.com") || lower.includes("gmail.com")) {
    const isGoogleFamilyInvite = lower.includes("families.google.com") || lower.includes("g.co/family") || lower.includes("/invitation");
    return !isGoogleFamilyInvite;
  }

  // CapCut (ignore homepage, only accept invite link)
  if (lower.includes("capcut.com")) {
    const isCapcutInvite = lower.includes("/invite/") || lower.includes("/join/") || lower.includes("token=");
    return !isCapcutInvite;
  }

  // Canva (ignore homepage, only accept brand/join invite link)
  if (lower.includes("canva.com")) {
    const isCanvaInvite = lower.includes("/brand/join") || lower.includes("/invite") || lower.includes("token=");
    return !isCanvaInvite;
  }

  // YouTube (ignore homepage, only accept family/redeem)
  if (lower.includes("youtube.com")) {
    const isYoutubeClaim = lower.includes("/redeem") || lower.includes("/family") || lower.includes("invite");
    return !isYoutubeClaim;
  }

  // Microsoft / Office (ignore homepage/login, only accept family/invite/redeem)
  if (lower.includes("microsoft.com") || lower.includes("office.com")) {
    const isMsClaim = lower.includes("/redeem") || lower.includes("/invite") || lower.includes("family");
    return !isMsClaim;
  }

  return false;
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
    if (/^(?:dùng riêng tư|cá nhân|email \+ mật khẩu|full date|30 ngày|bảo hành|mô tả|thông tin|định dạng)/i.test(cleanU)) return;
    if (/^(?:pass|password|mật khẩu|mk)$/i.test(cleanP)) return;

    const key = extra ? `${cleanU}|${cleanP}|${cleanPart(extra)}` : `${cleanU}|${cleanP}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(key);
    }
  }

  // Format 0: Direct line-by-line inspection for pipe-separated credentials (e.g. `email|pass|2fa`)
  const lines = text.split("\n");
  for (const rawLine of lines) {
    let line = cleanPart(rawLine);
    if (!line.includes("|")) continue;

    // Strip leading list numbers/bullets: e.g. "1)", "1.", "- ", "* "
    line = line.replace(/^\s*(?:\d+[\.\)]|[-*•])\s*/, "");
    // Strip leading label headers: e.g. "Định dạng:", "Tài khoản:", "TK:", "Account:"
    line = line.replace(/^(?:định\s*dạng|loại\s*(?:tài\s*khoản)?|tài\s*khoản|account|tk|email|thông\s*tin)\s*[:：\-]\s*/i, "");

    const parts = line.split("|").map(cleanPart).filter(Boolean);
    if (parts.length >= 2) {
      const u = parts[0];
      const p = parts[1];
      const extra = parts.slice(2).join("|");

      const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(u);
      const isUsername = /^[a-zA-Z0-9._-]{3,50}$/.test(u) && !/^(?:email|pass|password|loại|định dạng|http|https)$/i.test(u);

      if ((isEmail || isUsername) && p && !/^(?:pass|password|mật khẩu|mk)$/i.test(p)) {
        addResult(u, p, extra);
      }
    }
  }
  if (results.length > 0) {
    return results;
  }

  // Format 0.5: Inline labeled credentials on same line (e.g. `Email: ... password: ... Full Mail: ...`)
  const inlineLabeledRegex = /(?:Email|Tài\s*khoản|TK|User):\s*`?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[^\s`|:]+)`?[^\S\r\n]+(?:password|pass|mật\s*khẩu|mk):\s*`?([^\s`|]+)`?(?:[^\S\r\n]+(?:Full\s*Mail|Mail|Email\s*gốc|Hotmail|2FA|Cookie|Token):\s*`?([^\n\r`]+)`?)?/gi;
  let inlineMatch: RegExpExecArray | null;
  while ((inlineMatch = inlineLabeledRegex.exec(text)) !== null) {
    addResult(
      inlineMatch[1],
      inlineMatch[2],
      inlineMatch[3] ? `Full Mail: ${cleanPart(inlineMatch[3])}` : undefined
    );
  }
  if (results.length > 0) {
    return results;
  }

  // Format 1: Explicit labeled fields across lines:
  // (Tài khoản / Email / TK: ...) followed by (Mật khẩu / Pass / MK: ...)
  const labeledRegex = /(?:(?<!(?:Loại|Tên|Dạng|Định dạng)\s*)(?:Tài\s*khoản|Email|Username|User|TK)):\s*`?([^\n\r`|]+)`?[\s\S]*?(?:Mật\s*khẩu|Pass|Password|MK):\s*`?([^\s\n\r`|]+)`?(?:[^\S\r\n]*(?:Full\s*Mail|Mail|2FA|Cookie|Token):\s*`?([^\n\r`]+)`?)?/gi;
  let match: RegExpExecArray | null;
  while ((match = labeledRegex.exec(text)) !== null) {
    addResult(
      match[1],
      match[2],
      match[3] ? `Full Mail: ${cleanPart(match[3])}` : undefined
    );
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

  // 2. CRITICAL: Check account credentials FIRST (user|pass, email|pass|2fa, etc.)
  // When suppliers deliver accounts (ChatGPT, CapCut, Netflix, etc.), they routinely include
  // utility links (like https://chatgpt.com, https://2fa.live). Those utility links must NEVER
  // displace or hide the genuine account credentials!
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

  // 3. Check for License Key: e.g. "Key: XXXXX-XXXXX" or "Mã kích hoạt: XXXXX" or sk-...
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

  // 4. Check for genuine invite/claim URLs (Google Family, Gemini, Canva, Office...)
  // Strictly filter out internal Telegram links, social media, and utility/portal URLs (chatgpt.com, 2fa.live, etc.)
  const linkMatches = text.match(/https?:\/\/[^\s`"')]+/gi);
  if (linkMatches && linkMatches.length > 0) {
    const validClaimLinks = linkMatches.filter((url) => !isUtilityOrNonClaimUrl(url));
    if (validClaimLinks.length > 0) {
      return {
        type: "link",
        content: validClaimLinks[0],
        instructions: sanitizeInstructions(text, [validClaimLinks[0]]),
        rawText: text,
        deliveredKeys: validClaimLinks,
      };
    }
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
