const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const sups = await prisma.supplier.findMany();
  sups.forEach(s => {
    const json = JSON.stringify(s);
    if (json.includes('<') || json.includes('>')) {
      console.log('Supplier with brackets:', s.name, s.code, 'depositSyntax:', s.depositSyntax);
    }
  });
}

run().finally(() => prisma.$disconnect());
