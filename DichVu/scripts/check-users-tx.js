const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      walletTransactions: { take: 5, orderBy: { createdAt: 'desc' } },
      depositOrders: { take: 5, orderBy: { createdAt: 'desc' } }
    }
  });

  console.log("=== USERS ===");
  for (const u of users) {
    console.log(`User: ${u.email} | Balance: ${u.balance} | Role: ${u.role}`);
    for (const d of u.depositOrders) {
      console.log(`  Deposit: ${d.depositCode} | Status: ${d.status} | Amount: ${d.amount}`);
    }
    for (const w of u.walletTransactions) {
      console.log(`  WalletTx: ${w.type} | Amount: ${w.amount} | BalanceAfter: ${w.balanceAfter} | Desc: ${w.description}`);
    }
  }

  const transactions = await prisma.paymentTransaction.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log("=== PAYMENT TRANSACTIONS ===");
  for (const t of transactions) {
    console.log(`Tx: ${t.transactionId} | Amount: ${t.amount} | Content: ${t.content} | Status: ${t.status}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
