const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/components/admin/OrdersManagerClient.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add Play to lucide-react imports if not present
if (!content.includes('Play,')) {
  content = content.replace(/(\s+EyeOff,)/, '$1\r\n  Play,');
}

// 2. Add YouTube Family task card if not present
const targetBlock = '                              {/* Dedicated Account Upgrade Task Card */}';

if (!content.includes('Dedicated YouTube Family Task Card')) {
  const youtubeCard = `                              {/* Dedicated YouTube Family Task Card */}
                              {(() => {
                                const note = order.customerNote || "";
                                const isYoutubeFamily =
                                  note.includes("YOUTUBE_FAMILY") ||
                                  order.orderItems?.some(
                                    (i) =>
                                      i.product?.slug?.includes("youtube") ||
                                      i.product?.title?.toLowerCase().includes("youtube")
                                  );

                                if (!isYoutubeFamily) return null;

                                const cleanYoutubeNote = note
                                  .replace(/\\[?YOUTUBE_FAMILY_INVITES?\\]?/gi, "")
                                  .replace(/\\[?YOUTUBE_FAMILY\\]?/gi, "")
                                  .trim();

                                let parsedYoutubeEmails: string[] = [];
                                const lines = cleanYoutubeNote.split("\\n").map((l) => l.trim()).filter(Boolean);
                                for (const line of lines) {
                                  const match = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
                                  if (match) {
                                    parsedYoutubeEmails.push(match[0]);
                                  } else if (line.includes("@")) {
                                    parsedYoutubeEmails.push(line);
                                  }
                                }

                                if (parsedYoutubeEmails.length === 0 && order.customerEmail) {
                                  parsedYoutubeEmails.push(order.customerEmail);
                                }
                                if (parsedYoutubeEmails.length === 0) {
                                  parsedYoutubeEmails.push("Khách chưa nhập email");
                                }

                                const isDone = order.upstreamStatus === "COMPLETED";
                                const allEmailsText = parsedYoutubeEmails.join("\\n");

                                return (
                                  <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-4 space-y-3 shadow-md mb-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-500/20 pb-3">
                                      <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm">
                                          <Play className="h-3.5 w-3.5 fill-current" />
                                        </div>
                                        <div>
                                          <span className="text-xs font-bold uppercase tracking-wider text-red-200">
                                            Nhiệm vụ thêm Family YouTube Premium ({parsedYoutubeEmails.length} Email)
                                          </span>
                                          <div className="text-[11px] text-red-300/70">
                                            Đơn hàng #{order.orderCode} • Tổng tiền: {order.totalAmount.toLocaleString("vi-VN")}đ
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2">
                                        <a
                                          href="https://families.google.com/families"
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-100 hover:text-white text-xs font-medium transition-all"
                                          title="Mở Google Family Admin để mời thành viên"
                                        >
                                          <ExternalLink className="h-3.5 w-3.5 text-red-300" />
                                          <span>Mở Google Family</span>
                                        </a>

                                        <button
                                          type="button"
                                          onClick={() => handleCopy(allEmailsText)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-all"
                                          title="Copy toàn bộ danh sách Gmail"
                                        >
                                          <Copy className="h-3.5 w-3.5 text-red-400" />
                                          <span>Copy all ({parsedYoutubeEmails.length})</span>
                                        </button>

                                        <span className={\`text-[10px] font-bold px-2.5 py-1 rounded-full font-mono \${
                                          isDone
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                                        }\`}>
                                          {isDone ? "✓ ĐÃ ADD FAMILY XONG (DONE)" : "⏳ CHỜ ADMIN ADD FAMILY"}
                                        </span>

                                        {!isDone && (
                                          <button
                                            type="button"
                                            disabled={isSubmittingFulfill}
                                            onClick={async () => {
                                              const confirmDone = window.confirm(
                                                \`Xác nhận bạn đã gửi lời mời Family YouTube Premium cho \${parsedYoutubeEmails.length} email (\${parsedYoutubeEmails.join(", ")})?\\nBấm OK để hoàn tất đơn hàng và gửi hướng dẫn kích hoạt cho khách!\`
                                              );
                                              if (!confirmDone) return;
                                              const defaultSecrets = parsedYoutubeEmails.map((email, idx) =>
                                                \`EMAIL #\${idx + 1}: \${email} | GÓI: YouTube Premium Chính Chủ (Gia hạn nhóm Gia đình) | TRẠNG THÁI: Đã gửi lời mời Family thành công 100%! | HƯỚNG DẪN: Quý khách vui lòng kiểm tra hộp thư Gmail (hoặc mục Spam/Quảng cáo), mở thư mời từ Google Families / YouTube và bấm "Chấp nhận lời mời" (Accept Invitation) để kích hoạt trọn vẹn YouTube Premium & YouTube Music.\`
                                              );
                                              await handleManualFulfillWithSecret(
                                                order.id,
                                                defaultSecrets.join("\\n"),
                                                \`Admin đã thêm Family YouTube Premium thành công (\${parsedYoutubeEmails.length} email)\`
                                              );
                                            }}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white text-xs font-extrabold transition-all shadow-md shadow-red-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
                                          >
                                            <Sparkles className="h-4 w-4 text-amber-300 animate-spin" />
                                            <span>✨ HOÀN TẤT ADD FAMILY (BẤM DONE)</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Email List Display */}
                                    <div className="space-y-2">
                                      <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 px-3 uppercase tracking-wider">
                                        <div className="col-span-1 text-center">STT</div>
                                        <div className="col-span-8">Địa chỉ Gmail khách nhận lời mời Family</div>
                                        <div className="col-span-3 text-right">Thao tác</div>
                                      </div>

                                      {parsedYoutubeEmails.map((email, index) => (
                                        <div
                                          key={index}
                                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs bg-slate-900/90 p-3 rounded-xl border border-slate-800 items-center hover:border-red-500/30 transition-colors"
                                        >
                                          <div className="sm:col-span-1 text-slate-400 font-mono font-bold sm:text-center flex items-center justify-between sm:justify-center">
                                            <span className="sm:hidden text-slate-500 font-normal">Gmail</span>
                                            <span>#{index + 1}</span>
                                          </div>

                                          <div className="sm:col-span-8">
                                            <span className="text-slate-400 block text-[10px] font-medium sm:hidden mb-0.5">Gmail:</span>
                                            <div className="flex items-center gap-2 font-mono font-bold text-white select-all">
                                              <span className="truncate text-red-200">{email}</span>
                                              <button
                                                type="button"
                                                onClick={() => handleCopy(email)}
                                                className="text-slate-400 hover:text-white p-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors shrink-0"
                                                title="Copy Gmail này"
                                              >
                                                {copiedKey === email ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                              </button>
                                            </div>
                                          </div>

                                          <div className="sm:col-span-3 sm:text-right flex items-center justify-end gap-2">
                                            <a
                                              href={\`mailto:\${email}\`}
                                              className="text-slate-400 hover:text-white text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700"
                                            >
                                              Gửi mail
                                            </a>
                                            <button
                                              type="button"
                                              onClick={() => handleCopy(email)}
                                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-300 hover:text-white px-2 py-1 rounded bg-red-600/20 hover:bg-red-600/40 border border-red-500/30"
                                            >
                                              <Copy className="h-3 w-3" />
                                              <span>Copy</span>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
\r\n` + targetBlock;

  content = content.replace(targetBlock, youtubeCard);
}

// 3. Exclude isYoutubeFamily from Gemini isUpgrade
content = content.replace(
  'const isUpgrade =\r\n                                    note.includes("UPGRADE_ACCOUNT") ||',
  `const isYoutubeCheck =
                                    note.includes("YOUTUBE_FAMILY") ||
                                    order.orderItems?.some((i) => i.product?.slug?.includes("youtube") || i.product?.title?.toLowerCase().includes("youtube"));
                                  const isUpgrade =
                                    !isYoutubeCheck &&
                                    (note.includes("UPGRADE_ACCOUNT") ||`
);
content = content.replace(
  'const isUpgrade =\n                                    note.includes("UPGRADE_ACCOUNT") ||',
  `const isYoutubeCheck =
                                    note.includes("YOUTUBE_FAMILY") ||
                                    order.orderItems?.some((i) => i.product?.slug?.includes("youtube") || i.product?.title?.toLowerCase().includes("youtube"));
                                  const isUpgrade =
                                    !isYoutubeCheck &&
                                    (note.includes("UPGRADE_ACCOUNT") ||`
);

// Close extra parenthesis in isUpgrade condition if needed
content = content.replace(
  'i.product?.title?.toLowerCase().includes("chính chủ")\r\n                                    );',
  'i.product?.title?.toLowerCase().includes("chính chủ"))\r\n                                    );'
);
content = content.replace(
  'i.product?.title?.toLowerCase().includes("chính chủ")\n                                    );',
  'i.product?.title?.toLowerCase().includes("chính chủ"))\n                                    );'
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully patched OrdersManagerClient.tsx');
