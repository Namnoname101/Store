const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/components/SecretDisplay.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add YoutubePremiumCelebrationHub import
if (!content.includes('YoutubePremiumCelebrationHub')) {
  content = content.replace(
    'import GeminiProUpgradeCelebrationHub from "@/components/GeminiProUpgradeCelebrationHub";',
    'import GeminiProUpgradeCelebrationHub from "@/components/GeminiProUpgradeCelebrationHub";\r\nimport YoutubePremiumCelebrationHub from "@/components/YoutubePremiumCelebrationHub";'
  );
}

// 2. Define isYoutubeOrder and update isGeminiUpgradeOrder
if (!content.includes('const isYoutubeOrder =')) {
  content = content.replace(
    '  const isGeminiUpgradeOrder = Boolean(',
    `  const isYoutubeOrder = Boolean(
    orderItems?.some((item) => {
      const slug = (item.product?.slug || "").toLowerCase();
      const title = (item.product?.title || "").toLowerCase();
      return slug.includes("youtube") || title.includes("youtube");
    })
  );

  const isGeminiUpgradeOrder = !isYoutubeOrder && Boolean(`
  );
}

// 3. Update waiting title and description
const oldTitle = `{isGeminiUpgradeOrder
                  ? "Kỹ thuật viên đang nâng cấp 5TB cho bạn... 🚀"
                  : "Đang chuẩn bị mã riêng cho bạn... 🚀"}`;

const newTitle = `{isYoutubeOrder
                  ? "Admin đang gửi lời mời Family YouTube Premium cho bạn... 🎬"
                  : isGeminiUpgradeOrder
                  ? "Kỹ thuật viên đang nâng cấp 5TB cho bạn... 🚀"
                  : "Đang chuẩn bị mã riêng cho bạn... 🚀"}`;

content = content.replace(oldTitle, newTitle);

const oldDesc = `{isGeminiUpgradeOrder
                  ? "Đơn hàng đã được chuyển tới Quản trị viên. Shop đang tiến hành nạp gói Google One 5TB và Gemini Pro 12 Tháng vào tài khoản của bạn. Ngay khi hoàn tất, màn hình này sẽ tự động chuyển sang giao diện chúc mừng hoành tráng!"
                  : "Bạn vui lòng đợi trong giây lát nha! Shop đang điều phối nguồn cấp hoặc cập nhật key riêng cho đơn hàng này, cập nhật xong hệ thống sẽ tự động hiển thị mã ngay tại màn hình này mà không cần bấm tải lại trang!"}`;

const newDesc = `{isYoutubeOrder
                  ? "Đơn hàng đã được chuyển tới Quản trị viên. Shop đang tiến hành gửi lời mời tham gia nhóm YouTube Family vào địa chỉ Gmail của bạn. Ngay khi gửi xong (Admin bấm DONE), bạn chỉ cần mở Gmail bấm 'Chấp nhận lời mời' là kích hoạt ngay!"
                  : isGeminiUpgradeOrder
                  ? "Đơn hàng đã được chuyển tới Quản trị viên. Shop đang tiến hành nạp gói Google One 5TB và Gemini Pro 12 Tháng vào tài khoản của bạn. Ngay khi hoàn tất, màn hình này sẽ tự động chuyển sang giao diện chúc mừng hoành tráng!"
                  : "Bạn vui lòng đợi trong giây lát nha! Shop đang điều phối nguồn cấp hoặc cập nhật key riêng cho đơn hàng này, cập nhật xong hệ thống sẽ tự động hiển thị mã ngay tại màn hình này mà không cần bấm tải lại trang!"}`;

content = content.replace(oldDesc, newDesc);

// 4. Render YoutubePremiumCelebrationHub when completed
if (!content.includes('isYoutubeOrder && validDeliveredItems.length > 0')) {
  const targetCompleted = '  if (isGeminiUpgradeOrder && validDeliveredItems.length > 0) {';
  const youtubeCompleted = `  if (isYoutubeOrder && validDeliveredItems.length > 0) {
    return (
      <div className="space-y-6">
        <BuffProgressCard orderCode={orderCode} />
        <YoutubePremiumCelebrationHub
          orderCode={orderCode}
          customerEmail={customerEmail}
          customerNote={customerNote}
          deliveredItems={validDeliveredItems}
        />
      </div>
    );
  }

  if (isGeminiUpgradeOrder && validDeliveredItems.length > 0) {`;

  content = content.replace(targetCompleted, youtubeCompleted);
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully patched SecretDisplay.tsx');
