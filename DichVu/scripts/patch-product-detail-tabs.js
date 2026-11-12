const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/ProductDetailTabs.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the ChatGPT warranty rules section
const oldBlockStart = '{/* Strict Transparent Warranty Rules (Quy định nhà cung cấp - Tránh mất lòng) */}';
const oldBlockEnd = '{/* Product Description */}';

const startIndex = content.indexOf(oldBlockStart);
const endIndex = content.indexOf(oldBlockEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find start or end index", { startIndex, endIndex });
  process.exit(1);
}

const replacement = `{/* Strict Transparent Warranty Rules (Quy định nhà cung cấp - Tránh mất lòng) */}
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                    <h3 className="text-base font-bold text-foreground">
                      Chính sách bảo hành &amp; Quy định sử dụng (Minh bạch - Tránh mất lòng)
                    </h3>
                  </div>
                  <span className={\`px-2.5 py-0.5 rounded-full text-[11px] font-bold \${
                    isChatGPTFree
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      : isChatGPTBusiness || isChatGPTRealBHF
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }\`}>
                    {isChatGPTFree
                      ? "Bảo hành đăng nhập lần đầu (Login OK)"
                      : isChatGPTBusiness
                      ? "Bảo hành Full 30 Ngày 1 Đổi 1 (Workspace BHF)"
                      : isChatGPTRealBHF
                      ? "Bảo hành Full 30 Ngày 1 Đổi 1 (BHF)"
                      : "Bảo hành đăng nhập 24H (Gói Tiết Kiệm)"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                  {isChatGPTFree
                    ? "Áp dụng đúng chính sách nhà cung cấp MMO D-Shop: Bảo hành tài khoản sạch, đăng nhập thành công và đã kích hoạt sẵn số điện thoại quốc tế:"
                    : isChatGPTBusiness
                    ? "Áp dụng đúng chính sách nhà cung cấp DKeyShop: Bảo hành trọn vẹn 30 ngày quyền thành viên trong Workspace Business dùng chung:"
                    : isChatGPTRealBHF
                    ? "Gói cao cấp được nhà cung cấp cam kết bảo hành 1 đổi 1 hoặc cấp lại Plus trong suốt 30 ngày sử dụng nếu phát sinh lỗi kỹ thuật:"
                    : "Gói giá rẻ tiết kiệm hơn 70% so với giá gốc, áp dụng đúng chính sách nhà cung cấp Shop Xoài Non: bảo hành đăng nhập & kiểm tra Plus chuẩn trong 24 giờ đầu:"}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cột được bảo hành */}
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>
                        {isChatGPTFree
                          ? "ĐƯỢC BẢO HÀNH (KHI NHẬN HÀNG)"
                          : isChatGPTBusiness || isChatGPTRealBHF
                          ? "ĐƯỢC BẢO HÀNH (1 ĐỔI 1 SUỐT 30 NGÀY)"
                          : "ĐƯỢC BẢO HÀNH (TRONG 24H ĐẦU)"}
                      </span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
                      {isChatGPTFree ? (
                        <>
                          <li>Tài khoản đăng nhập thành công lần đầu tại chatgpt.com.</li>
                          <li>Tài khoản đã được xác minh số điện thoại quốc tế (SMS Verified) sẵn sàng sử dụng.</li>
                          <li>Tạo được API Key và trích xuất Session Token cho Cursor, VS Code, Codex mà không bị hỏi SĐT.</li>
                          <li>Trong vòng 24 giờ đầu nếu sai mật khẩu hoặc lỗi xác thực &rarr; 1 ĐỔI 1 MỚI NGAY LẬP TỨC.</li>
                        </>
                      ) : isChatGPTBusiness ? (
                        <>
                          <li>Quyền thành viên Workspace Business liên tục trong suốt 30 ngày.</li>
                          <li>Tài khoản sử dụng trọn vẹn GPT-4o, o3-mini, Canvas, tạo ảnh DALL-E với hạn mức cao.</li>
                          <li>Lịch sử chat và dữ liệu cá nhân hoàn toàn riêng tư trong tài khoản của bạn.</li>
                          <li>Hỗ trợ đổi mới hoặc cấp lại slot nhanh chóng trong 15 - 30 phút nếu Workspace gặp trục trặc kỹ thuật.</li>
                        </>
                      ) : isChatGPTRealBHF ? (
                        <>
                          <li>Tài khoản bị mất gói Plus, lỗi subscription do lỗi từ OpenAI hoặc hệ thống trong suốt 30 ngày.</li>
                          <li>Tài khoản không đăng nhập được ngay từ đầu do sai lệch thông tin mật khẩu.</li>
                          <li>Được phép thay đổi mật khẩu cá nhân để bảo mật tối đa.</li>
                          <li>Hỗ trợ đổi mới hoặc cấp lại Plus nhanh chóng trong 15 - 30 phút (tối đa 24h).</li>
                          <li>Trường hợp tạm thời hết tài khoản đổi, hệ thống hoàn tiền theo tỷ lệ số ngày còn lại chưa sử dụng.</li>
                        </>
                      ) : (
                        <>
                          <li>Cam kết tài khoản có tích xanh Plus chuẩn 100%, đăng nhập thành công tại chatgpt.com.</li>
                          <li>Trong vòng 24 giờ đầu nếu sai pass hoặc không có gói Plus &rarr; 1 ĐỔI 1 MỚI NGAY LẬP TỨC.</li>
                          <li>Hỗ trợ kiểm tra tài khoản và hướng dẫn đăng nhập trực tuyến 24/7.</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {/* Cột từ chối bảo hành / Hết hạn */}
                  <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 space-y-3">
                    <div className="flex items-center gap-2 text-destructive font-bold text-xs sm:text-sm">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>
                        {isChatGPTFree
                          ? "TỪ CHỐI BẢO HÀNH (SAU KHI LOGIN)"
                          : isChatGPTBusiness || isChatGPTRealBHF
                          ? "TỪ CHỐI BẢO HÀNH (CÁC TRƯỜNG HỢP VI PHẠM)"
                          : "TỪ CHỐI &amp; QUY ĐỊNH SAU 24H"}
                      </span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
                      {isChatGPTFree ? (
                        <>
                          <li><strong>Lưu ý quan trọng:</strong> Đây là tài khoản Free đã kích hoạt SĐT, KHÔNG PHẢI gói trả phí Plus.</li>
                          <li>Khách hàng tự ý thay đổi Email tài khoản được cấp.</li>
                          <li>Sau khi đã bàn giao đăng nhập thành công: Không bảo hành trường hợp khách hàng vi phạm chính sách của OpenAI dẫn đến checkpoint hoặc khóa nick.</li>
                        </>
                      ) : isChatGPTBusiness ? (
                        <>
                          <li>Khách hàng tự ý can thiệp cài đặt quản trị (Workspace Settings) hoặc phần Thanh toán (Billing).</li>
                          <li>Khách hàng tự ý bấm "Leave Workspace" (Rời khỏi không gian làm việc).</li>
                          <li>Khách hàng tự ý thay đổi email tài khoản được cấp.</li>
                          <li>Vi phạm chính sách nội dung của OpenAI khiến tài khoản bị khóa vĩnh viễn.</li>
                        </>
                      ) : isChatGPTRealBHF ? (
                        <>
                          <li>Khách hàng tự ý thay đổi Email tài khoản được cấp.</li>
                          <li>Khách hàng <strong>XÓA 2FA</strong> của tài khoản (Quy định bắt buộc: Không được xóa 2FA, chỉ được đổi mã 2FA).</li>
                          <li>Khách hàng tự ý bấm hủy gói (Cancel Subscription) hoặc can thiệp thông tin Billing trong Cài đặt OpenAI.</li>
                          <li>Vi phạm chính sách nội dung của OpenAI: Sử dụng prompt độc hại, tạo nội dung NSFW/18+, bạo lực, spam bot quá tải khiến OpenAI khóa vĩnh viễn.</li>
                          <li>Chia sẻ tài khoản tràn lan cho nhiều người, đổi quá nhiều địa chỉ IP lạ cùng lúc.</li>
                        </>
                      ) : (
                        <>
                          <li><strong>Sau 24 giờ:</strong> Hết thời hạn bảo hành từ nhà cung cấp (không bảo hành tụt Plus hoặc đợt quét tài khoản từ OpenAI sau 24h).</li>
                          <li>Khách hàng tự ý thay đổi Email tài khoản được cấp.</li>
                          <li>Khách hàng <strong>XÓA 2FA</strong> (Chỉ được đổi 2FA qua 2fa.live, xóa 2FA nhà cung cấp từ chối bảo hành).</li>
                          <li>Khách hàng sử dụng Codex phải tự xác minh SMS.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {isChatGPTReal24H && (
                  <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2.5 text-xs text-foreground">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Bạn cần sự an tâm và bảo hành suốt 30 ngày?</strong> Quý khách có thể chọn{" "}
                      <Link href="/products/chatgpt-plus-1-thang-bhf" className="font-bold text-primary underline hover:text-primary/80">
                        Gói ChatGPT Plus 1 Tháng Riêng Tư - BHF (Bảo Hành Full 30 Ngày)
                      </Link>{" "}
                      để được cam kết 1 đổi 1 trong suốt 30 ngày làm việc.
                    </span>
                  </div>
                )}

                <div className="mt-3 p-3 rounded-xl bg-secondary/50 border border-border flex items-start gap-2.5 text-xs text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Khuyến nghị sử dụng:</strong> {isChatGPTFree ? "Đăng nhập trên trình duyệt web hoặc công cụ lập trình, không chia sẻ công khai." : "Quý khách nên đăng nhập trên 1-2 thiết bị cá nhân (trình duyệt web hoặc ứng dụng ChatGPT chính thức) và không chia sẻ công khai để tài khoản luôn hoạt động mượt mà và ổn định nhất."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CapCut Strict 1-Device Policy from NCC */}
          {isCapCut && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>QUY ĐỊNH BẮT BUỘC TỪ NHÀ CUNG CẤP CAPCUT (ĐỌC KỸ TRƯỚC KHI DÙNG)</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
                <li><strong>Chỉ đăng nhập trên 1 thiết bị duy nhất:</strong> Tuyệt đối không đăng nhập máy thứ 2 (kể cả chuyển từ điện thoại sang máy tính).</li>
                <li><strong>Tuyệt đối KHÔNG ĐĂNG XUẤT (Logout):</strong> Đăng xuất sẽ làm mất quyền Pro của tài khoản.</li>
                <li><strong>Tuyệt đối KHÔNG XÓA APP:</strong> Xóa ứng dụng và cài lại sẽ được tính là thiết bị mới, nhà cung cấp sẽ từ chối bảo hành.</li>
                <li><strong>Chính sách bảo hành:</strong> Cam kết bảo hành 1 đổi 1 trong suốt {isCapCut7D ? "7 ngày" : "30 ngày"} nếu tài khoản tuân thủ đúng các quy định trên mà bị mất Pro.</li>
              </ul>
            </div>
          )}

          `;

content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched ProductDetailTabs.tsx!');
