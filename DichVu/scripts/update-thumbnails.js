const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating product thumbnails...');

  // 1. NordVPN Premium
  const nord = await prisma.product.findFirst({
    where: { slug: { contains: 'nord' } }
  });
  if (nord) {
    await prisma.product.update({
      where: { id: nord.id },
      data: {
        thumbnailUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80'
      }
    });
    console.log('Updated NordVPN thumbnail to cybersecurity network shield.');
  }

  // 2. Facebook Follower
  const fbFollow = await prisma.product.findFirst({
    where: { slug: 'tang-follow-facebook-1000' }
  });
  if (fbFollow) {
    await prisma.product.update({
      where: { id: fbFollow.id },
      data: {
        thumbnailUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&auto=format&fit=crop&q=80'
      }
    });
    console.log('Updated Facebook Follower thumbnail.');
  }

  // 3. Canva Pro
  const canva = await prisma.product.findFirst({
    where: { slug: 'canva-pro-1-thang' }
  });
  if (canva) {
    await prisma.product.update({
      where: { id: canva.id },
      data: {
        thumbnailUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80'
      }
    });
    console.log('Updated Canva Pro thumbnail.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
