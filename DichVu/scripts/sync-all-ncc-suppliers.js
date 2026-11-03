const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NCC_DATA = [
  {
    code: "XOAINON_TELE",
    name: "Shop Xoài Non (Telegram Bot)",
    type: "TELEGRAM_BOT",
    baseUrl: "shopxoainon_bot",
    apiKey: "TELEGRAM_USER_SESSION",
    depositBankId: "CAKE",
    depositAccountNo: "0928000760",
    depositAccountName: "SHOP XOAI NON",
    depositSyntax: "Tự động theo số tiền lẻ (Delta pennies)",
    isActive: true,
  },
  {
    code: "KHOMMO_TELE",
    name: "Kho MMO Market (Telegram Bot)",
    type: "TELEGRAM_BOT",
    baseUrl: "KhoMMO_Market_bot",
    apiKey: "TELEGRAM_USER_SESSION",
    depositBankId: "ACB",
    depositAccountNo: "46909597",
    depositAccountName: "KHO MMO MARKET",
    depositSyntax: "Lệnh: /nap <số_tiền> (Ví dụ: /nap 50000)",
    isActive: true,
  },
  {
    code: "DSHOP_TELE",
    name: "MMO D-Shop (Telegram Bot)",
    type: "TELEGRAM_BOT",
    baseUrl: "mmo_dshop_bot",
    apiKey: "TELEGRAM_USER_SESSION",
    depositBankId: "MB",
    depositAccountNo: "03950990099999",
    depositAccountName: "MMO DSHOP",
    depositSyntax: "NAP-<MÃ_BOT>",
    isActive: true,
  },
  {
    code: "TOKI_TELE",
    name: "Toki Shop MMO (Telegram Bot)",
    type: "TELEGRAM_BOT",
    baseUrl: "toki_shopmmo_bot",
    apiKey: "TELEGRAM_USER_SESSION",
    depositBankId: "MB",
    depositAccountNo: "02226201432211",
    depositAccountName: "NGUYEN VAN HUNG",
    depositSyntax: "TOKIN1853328773",
    isActive: true,
  },
  {
    code: "DKEY_TELE",
    name: "DKeyShop MMO (Telegram Bot)",
    type: "TELEGRAM_BOT",
    baseUrl: "dkeyshop_bot",
    apiKey: "TELEGRAM_USER_SESSION",
    depositBankId: "BIDV",
    depositAccountNo: "963869DKEY",
    depositAccountName: "DKEYSHOP MMO",
    depositSyntax: "ORDER...",
    isActive: true,
  },
  {
    code: "SHOPHXN_TELE",
    name: "HXN Shop MMO (Telegram Bot)",
    type: "TELEGRAM_BOT",
    baseUrl: "ShopHXN_bot",
    apiKey: "TELEGRAM_USER_SESSION",
    depositBankId: "MB",
    depositAccountNo: "456677888",
    depositAccountName: "HXN SHOP",
    depositSyntax: "ORDER...",
    isActive: true,
  },
  {
    code: "CHODAUMOI_TELE",
    name: "Chợ Đầu Mối MMO (Telegram Bot)",
    type: "TELEGRAM_BOT",
    baseUrl: "chodaumoi_bot",
    apiKey: "TELEGRAM_USER_SESSION",
    depositBankId: "ACB",
    depositAccountNo: "31597857",
    depositAccountName: "NGUYEN CUU DUC",
    depositSyntax: "NAP1853328773...",
    isActive: true,
  },
  {
    code: "HIHISTORE_TELE",
    name: "PQV Store (Telegram Bot)",
    type: "TELEGRAM_BOT",
    baseUrl: "hihistorebot",
    apiKey: "TELEGRAM_USER_SESSION",
    depositBankId: "MB",
    depositAccountNo: "006675678",
    depositAccountName: "PHAM QUANG VUONG",
    depositSyntax: "Tự động theo số tiền lẻ",
    isActive: true,
  },
  {
    code: "NGHIENTRICK_TELE",
    name: "Nghiện Trick Shop (Telegram Bot)",
    type: "TELEGRAM_BOT",
    baseUrl: "nghientrickshop_bot",
    apiKey: "TELEGRAM_USER_SESSION",
    depositBankId: "PAYOS",
    depositAccountNo: "Cổng PayOS Link",
    depositAccountName: "NGHIEN TRICK SHOP",
    depositSyntax: "DEP...",
    isActive: true,
  },
];

async function main() {
  console.log("Đang đồng bộ thông tin NCC vào Database...");
  for (const ncc of NCC_DATA) {
    const existing = await prisma.supplier.findUnique({ where: { code: ncc.code } });
    if (existing) {
      await prisma.supplier.update({
        where: { code: ncc.code },
        data: {
          name: ncc.name,
          baseUrl: ncc.baseUrl,
          depositBankId: ncc.depositBankId,
          depositAccountNo: ncc.depositAccountNo,
          depositAccountName: ncc.depositAccountName,
          depositSyntax: ncc.depositSyntax,
          isActive: ncc.isActive,
        },
      });
      console.log(`✓ Đã cập nhật NCC: ${ncc.code} - ${ncc.name}`);
    } else {
      await prisma.supplier.create({
        data: ncc,
      });
      console.log(`+ Đã thêm mới NCC: ${ncc.code} - ${ncc.name}`);
    }
  }
  console.log("\nHoàn tất 100%!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
