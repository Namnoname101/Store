function cleanPart(val) {
  if (!val) return '';
  return val.trim().replace(/^[`'"]+|[`'"]+$/g, '');
}

function sanitizeInstructions(text, extractedCredentials = []) {
  if (!text) return '';

  const lines = text.split('\n');
  const sanitizedLines = [];

  for (let line of lines) {
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
      const parts = cred.split('|');
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

  // Remove consecutive empty lines
  const result = sanitizedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return result;
}

function extractAccountsFromText(text) {
  if (!text || !text.trim()) return [];

  const results = [];
  const seen = new Set();

  function addResult(u, p, extra) {
    u = cleanPart(u);
    p = cleanPart(p);
    if (!u || !p) return;
    // Don't mistake descriptive labels or headers for credentials
    if (/^(?:dùng riêng tư|cá nhân|email \+ mật khẩu|full date|30 ngày|bảo hành|mô tả|thông tin)/i.test(u)) return;
    if (/^(?:pass|password|mật khẩu|mk)$/i.test(p)) return;

    const key = extra ? `${u}|${p}|${cleanPart(extra)}` : `${u}|${p}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(key);
    }
  }

  // Format 1: Explicit labeled fields across lines:
  // (Tài khoản / Email / TK: ...) followed by (Mật khẩu / Pass / MK: ...)
  const labeledRegex = /(?:(?<!(?:Loại|Tên|Dạng|Định dạng)\s*)(?:Tài\s*khoản|Email|Username|User|TK)):\s*`?([^\n\r`|]+)`?[\s\S]*?(?:Mật\s*khẩu|Pass|Password|MK):\s*`?([^\n\r`|]+)`?/gi;
  let match;
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
    if (!['email', 'pass', 'password', 'loại', 'ngày', 'http', 'https', 'định dạng'].includes(u)) {
      addResult(match[1], match[2]);
    }
  }

  return results;
}

function extractDeliveredSecret(rawText) {
  if (!rawText || !rawText.trim()) {
    return { type: 'text', content: '', rawText: '', deliveredKeys: [] };
  }

  const text = rawText.trim();

  // 1. Guard against error notices
  const isErrorNotice =
    /(?:số dư|ví)[^.]*không đủ|thất bại|không đủ để (?:mua|thanh toán|thực hiện)|nạp thêm tiền|hết hàng|error|failed|❌/i.test(text);
  if (isErrorNotice) {
    return {
      type: 'text',
      content: '',
      instructions: text,
      rawText: text,
      isNoticeOnly: true,
      deliveredKeys: [],
    };
  }

  // 2. Check for invite/claim URLs
  const linkMatches = text.match(/https?:\/\/[^\s`"')]+/gi);
  if (linkMatches && linkMatches.length > 0) {
    const externalLinks = linkMatches.filter(
      (url) => !url.includes('t.me/') && !url.includes('telegram.me/') && !url.includes('facebook.com/')
    );
    if (externalLinks.length > 0) {
      return {
        type: 'link',
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
      type: 'credentials',
      content: accounts.join('\n'),
      instructions: sanitizeInstructions(text, accounts),
      rawText: text,
      deliveredKeys: accounts,
    };
  }

  // 4. Check for License Key
  const keyMatch = text.match(
    /(?:Key|Mã\s*(?:kích\s*hoạt|key|bản\s*quyền|thẻ)):\s*`?([A-Z0-9-]{8,})`?/i
  ) || text.match(/`?(sk-[a-zA-Z0-9_-]{20,})`?/);

  if (keyMatch && keyMatch[1]) {
    const key = cleanPart(keyMatch[1]);
    return {
      type: 'key',
      content: key,
      instructions: sanitizeInstructions(text, [key]),
      rawText: text,
      deliveredKeys: [key],
    };
  }

  // 5. Fallback: sanitize the text so wholesale prices & balances are NEVER leaked
  const sanitizedFallback = sanitizeInstructions(text);
  return {
    type: 'text',
    content: sanitizedFallback,
    rawText: text,
    deliveredKeys: sanitizedFallback ? [sanitizedFallback] : [],
  };
}

// Run test cases
const rawCapcutMessage = `✅ **ĐƠN HÀNG THÀNH CÔNG**
━━━━━━━━━━━━━━━━
🧾 Mã đơn: \`UUJ87ZSYDY\`
🛒 Sản phẩm: 🎬 **Capcut Pro 30d full Date - BHF**
📊 Số lượng: **1**
💵 Thanh toán: **32.900đ**
💰 Số dư còn lại: **47.452đ**
━━━━━━━━━━━━━━━━
📝 **Mô tả lúc bán:**
Email | Pass
Hiện Full Date 30 ngày
📌 Thông tin tài khoản:
- Định dạng: Email + Mật khẩu (Password)
- Loại tài khoản: Dùng riêng tư

📱 BƯỚC 1: ĐĂNG NHẬP TRÊN ĐIỆN THOẠI (Bắt buộc làm trước)
* Lưu ý: Bạn BẮT BUỘC phải đăng nhập thành công trên điện thoại trước tiên.
1. Mở ứng dụng CapCut trên điện thoại.
2. Chọn mục "Sign in with email" (Đăng nhập bằng email).
3. Nhập địa chỉ Email và Mật khẩu (Password) của tài khoản được cung cấp.
4. Bấm Đăng nhập để hoàn tất.

💻 BƯỚC 2: ĐĂNG NHẬP TRÊN MÁY TÍNH / PC (Nếu cần)
Sau khi đã đăng nhập thành công trên điện thoại, tiến hành quét mã QR để đăng nhập PC:
- Trên iPhone (iOS): Mở CapCut -> Vào mục "Tôi" (Profile) -> Chọn biểu tượng Quét mã QR ở góc trên -> Quét mã QR trên màn hình CapCut PC.
- Trên Android: Cập nhật CapCut lên phiên bản mới nhất -> Sử dụng tính năng Quét QR trong app -> Quét mã QR trên màn hình CapCut PC.
Bảo hành 30 ngày
━━━━━━━━━━━━━━━━
🔐 **THÔNG TIN TÀI KHOẢN**
1)
\`ObergVillagran786@outlook.com 1234567\`
━━━━━━━━━━━━━━━━
⚠️ Vui lòng lưu lại thông tin.
💚 Cảm ơn bạn đã mua hàng tại shop!`;

const testCases = [
  { name: 'Xoài Non CapCut (Raw Chat)', input: rawCapcutMessage },
  { name: 'Standard Pipe', input: 'myuser@gmail.com|MyPass@123' },
  { name: 'Pipe with 2FA', input: 'myuser@gmail.com|MyPass@123|2FASECRETKEY' },
  { name: 'Space separated in backticks', input: '`testuser@hotmail.com pass8888`' },
  { name: 'Colon separated', input: 'test.account@outlook.com:PassWord999' },
  { name: 'Labeled Multi-line', input: 'Tài khoản: user.pro@gmail.com\nMật khẩu: Secret12345\nLưu ý đăng nhập sớm' },
  { name: 'Short labels TK/MK', input: 'TK: vipuser@gmail.com\nMK: VipPass2026' },
  { name: 'Multiple accounts', input: 'THÔNG TIN TÀI KHOẢN:\n1) acc1@gmail.com pass1\n2) acc2@gmail.com pass2' },
  { name: 'License Key', input: 'Key: VK7JG-NPHTM-C97JM-9MPGT-3V66T' },
  { name: 'API Key sk-...', input: 'Token của bạn: `sk-ant-api03-abcdef1234567890abcdef`' },
  { name: 'Invite Link', input: 'Link mời tham gia gia đình: https://families.google.com/join/invite/xyz123' }
];

console.log('=== RUNNING TESTS ===\n');
let allPassed = true;
for (const tc of testCases) {
  console.log(`--- Test: ${tc.name} ---`);
  const res = extractDeliveredSecret(tc.input);
  console.log('Type:', res.type);
  console.log('Content:', res.content);
  console.log('DeliveredKeys:', res.deliveredKeys);
  if (res.instructions) {
    console.log('Sanitized Instructions Preview:');
    console.log(res.instructions.slice(0, 100) + '...');
  }
  
  if (tc.name === 'Labeled Multi-line' && res.content !== 'user.pro@gmail.com|Secret12345') {
    console.error('FAILED Labeled Multi-line! Got:', res.content);
    allPassed = false;
  }
  if (tc.name === 'Short labels TK/MK' && res.content !== 'vipuser@gmail.com|VipPass2026') {
    console.error('FAILED Short labels TK/MK! Got:', res.content);
    allPassed = false;
  }
  if (tc.name.includes('CapCut')) {
    if (res.content !== 'ObergVillagran786@outlook.com|1234567') {
      console.error('FAILED CapCut extraction! Got:', res.content);
      allPassed = false;
    }
    if (res.instructions.includes('32.900') || res.instructions.includes('47.452') || res.instructions.includes('UUJ87ZSYDY')) {
      console.error('FAILED Sensitive info leak!');
      allPassed = false;
    }
  }
  console.log();
}

console.log('ALL PASSED:', allPassed);
