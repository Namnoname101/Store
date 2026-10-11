const { spawnSync } = require('child_process');

const remoteScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findMany({
  where: {
    OR: [
      { slug: { contains: 'nord' } },
      { slug: { contains: 'facebook' } },
      { slug: { contains: 'canva' } },
      { slug: { contains: 'duolingo' } },
      { slug: { contains: 'capcut' } }
    ]
  },
  select: { title: true, slug: true, thumbnailUrl: true }
}).then(res => { console.log(JSON.stringify(res, null, 2)); process.exit(0); });
`;

const b64 = Buffer.from(remoteScript).toString('base64');
const cmd = `sh -c "echo ${b64} | base64 -d | node"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-C', cmd], { encoding: 'utf8', timeout: 30000 });
console.log(res.stdout);
