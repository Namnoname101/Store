const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const sups = await prisma.supplier.findMany();
  console.log("=== SUPPLIER BALANCES IN DB ===");
  for (const s of sups) {
    console.log(`[${s.code}] ${s.name}:`);
    console.log(`  Balance: ${s.currentBalance?.toLocaleString("vi-VN")}đ | Type: ${s.type} | Active: ${s.isActive}`);
    console.log(`  Bank: ${s.depositBankId} | STK: ${s.depositAccountNo} | Chủ TK: ${s.depositAccountName}`);
    console.log(`  Syntax: ${s.depositSyntax}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
