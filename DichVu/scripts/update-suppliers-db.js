const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const UPDATES = [
  {
    code: "DKEY_API",
    data: {
      depositBankId: "BIDV",
      depositAccountNo: "963869DKEY",
      depositAccountName: "DKEYSHOP MMO",
      depositSyntax: "Nạp qua bot @dkeyshop_bot",
    },
  },
  {
    code: "SHOPHXN_API",
    data: {
      depositBankId: "MB",
      depositAccountNo: "456677888",
      depositAccountName: "HXN SHOP",
      depositSyntax: "Nạp qua bot @ShopHXN_bot",
    },
  },
  {
    code: "CHODAUMOI_API",
    data: {
      depositBankId: "ACB",
      depositAccountNo: "31597857",
      depositAccountName: "NGUYEN CUU DUC",
      depositSyntax: "Nạp qua bot @chodaumoi_bot",
    },
  },
  {
    code: "KHOMMO_API",
    data: {
      depositBankId: "ACB",
      depositAccountNo: "46909597",
      depositAccountName: "KHO MMO MARKET",
      depositSyntax: "Lệnh: /nap <số_tiền> tại @KhoMMO_Market_bot",
    },
  },
  {
    code: "LOCKET_VN",
    data: {
      depositBankId: "WEB",
      depositAccountNo: "locket.com.vn",
      depositAccountName: "LOCKET VIETNAM",
      depositSyntax: "Nạp tại website locket.com.vn",
    },
  },
  {
    code: "HACKTIM",
    data: {
      depositBankId: "WEB",
      depositAccountNo: "hacktim.com",
      depositAccountName: "HACKTIM SMM",
      depositSyntax: "Nạp tại website hacktim.com",
    },
  },
  {
    code: "GENZSHOP",
    data: {
      depositBankId: "WEB",
      depositAccountNo: "genzshop.vn",
      depositAccountName: "GENZSHOP",
      depositSyntax: "Nạp tại website genzshop.vn",
    },
  },
];

async function main() {
  console.log("Updating suppliers deposit info in database...");
  for (const item of UPDATES) {
    const sup = await prisma.supplier.findFirst({ where: { code: item.code } });
    if (sup) {
      await prisma.supplier.update({
        where: { id: sup.id },
        data: item.data,
      });
      console.log(`✅ Updated ${item.code}: ${item.data.depositBankId} | ${item.data.depositAccountNo} | ${item.data.depositAccountName}`);
    } else {
      console.log(`⚠️ Supplier ${item.code} not found in DB`);
    }
  }
  console.log("Done updating suppliers!");
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)));
