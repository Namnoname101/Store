const { spawnSync } = require('child_process');

const remoteScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findMany({ select: { title: true, type: true, category: { select: { slug: true } } } }).then(res => {
  const types = {};
  res.forEach(p => {
    const k = p.type + ' | ' + (p.category?.slug || 'none');
    types[k] = (types[k] || 0) + 1;
    if (p.type === 'COURSE_LINK') console.log('COURSE_LINK:', p.title, '| cat:', p.category?.slug);
  });
  console.log('SUMMARY:', types);
  process.exit(0);
});
`;

const b64 = Buffer.from(remoteScript).toString('base64');
const cmd = `sh -c "echo ${b64} | base64 -d | node"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-C', cmd], { encoding: 'utf8', timeout: 30000 });
console.log(res.stdout);
