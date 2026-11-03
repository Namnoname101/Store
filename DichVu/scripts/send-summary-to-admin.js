const https = require('https');
const token = '9158153869:AAH2ngarVNU5e3mRohVioIsu3iS39iU_DNU';
const chatId = '1853328773';

const message = `✅ <b>ĐÃ THU THẬP & TỰ ĐỘNG KHẢO SÁT TOÀN BỘ BOT NCC THÀNH CÔNG!</b>

Hệ thống Userbot đã tự động thao tác trực tiếp với từng bot NCC để lấy lệnh nạp tiền, thông tin tài khoản ngân hàng và cơ chế xác nhận:

1️⃣ <b>@shopxoainon_bot (Shop Xoài Non)</b>
• Lệnh: <code>/deposit</code> ➔ Chuyển khoản ngân hàng ➔ Chọn số tiền
• Ngân hàng: <b>Cake by VPBank</b> (546034)
• STK: <code>0928000760</code>
• Cơ chế: Phân bổ số tiền lẻ (Delta pennies) để cộng ví tự động trong 15-30s.

2️⃣ <b>@KhoMMO_Market_bot (Kho MMO Market)</b>
• Lệnh: <code>/nap &lt;số tiền&gt;</code> (Ví dụ: <code>/nap 20000</code>)
• Ngân hàng: <b>ACB</b> | STK: <code>46909597</code>
• Cơ chế: Bot trả về ảnh QR chuyển khoản kèm mã đơn (Ví dụ: <code>NAPAK42J5</code>).

3️⃣ <b>@mmo_dshop_bot (MMO D-Shop)</b>
• Lệnh: <code>/start</code> ➔ [Wallet] ➔ [➕ Top up VND QR] ➔ Nhập số tiền
• Ngân hàng: <b>MB Bank</b> | STK: <code>03950990099999</code>
• Cơ chế: Bot trả về ảnh VietQR gắn mã đơn dạng <code>NAP-XXXXXX</code>.

4️⃣ <b>@toki_shopmmo_bot (Toki Shop MMO)</b>
• Lệnh: <code>/help</code> ➔ [Ví của tôi] ➔ [＋ Nạp tiền] ➔ Nhập số tiền
• Ngân hàng: <b>MBBANK</b> | STK: <code>02226201432211</code>
• Chủ TK: <b>NGUYEN VAN HUNG</b>
• Cú pháp cố định: <code>TOKIN1853328773</code> (Cổng SePay tự động cộng tiền ngay lập tức).

5️⃣ <b>@dkeyshop_bot (DKeyShop MMO)</b>
• Lệnh: <code>/wallet</code> ➔ [Nạp vào ví] ➔ Nhập số tiền
• Ngân hàng: <b>BIDV</b> | STK: <code>963869DKEY</code>
• Cơ chế: Chuyển khoản theo mã đơn <code>ORDER...</code>

6️⃣ <b>@ShopHXN_bot (HXN Shop MMO)</b>
• Lệnh: <code>/wallet</code> ➔ [Nạp vào ví] ➔ Nhập số tiền
• Ngân hàng: <b>MBBank</b> | STK: <code>456677888</code>
• Cơ chế: Chuyển khoản theo mã đơn <code>ORDER...</code>

7️⃣ <b>@chodaumoi_bot (Chợ Đầu Mối MMO)</b>
• Lệnh: <code>/nap</code> ➔ Chọn mệnh giá
• Ngân hàng: <b>ACB</b> | STK: <code>31597857</code> (NGUYEN CUU DUC)
• Cơ chế: Quét QR chuyển khoản theo mã <code>NAP1853328773...</code>

8️⃣ <b>@hihistorebot (PQV Store Auto)</b>
• Lệnh: <code>/nap</code> ➔ Chọn mệnh giá
• Ngân hàng: <b>MB Bank</b> | STK: <code>006675678</code> (PHAM QUANG VUONG)
• Cơ chế: Phân bổ số tiền lẻ (Delta pennies) để cộng ví tự động.

9️⃣ <b>@nghientrickshop_bot (Nghiện Trick Shop)</b>
• Lệnh: <code>/start</code> ➔ [Ví của tôi] ➔ [Nạp tiền]
• Phương thức: Cổng thanh toán <b>PayOS Web Checkout Link</b>.

━━━━━━━━━━━━━━━━━━━━
✓ Toàn bộ cơ sở dữ liệu và menu <b>[💳 Nạp tiền NCC (VietQR)]</b> trên bot @Quanlykhodeebot đã được cập nhật đồng bộ 100%!`;

const data = JSON.stringify({
  chat_id: chatId,
  text: message,
  parse_mode: 'HTML',
  reply_markup: {
    inline_keyboard: [
      [{ text: '💳 Nạp tiền NCC (VietQR)', callback_data: 'cmd:topup_menu' }],
      [{ text: '🏢 Số dư các NCC', callback_data: 'cmd:supplier_balances' }]
    ]
  }
});

const req = https.request(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, res => {
  res.on('data', d => process.stdout.write(d));
});
req.write(data);
req.end();
