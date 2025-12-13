const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting policy update...');

  // Update or create Free policy
  await prisma.groupPolicy.upsert({
    where: { groupName: 'free' },
    update: {
      monthlyProjectLimit: 3,
      monthlyPresentationLimit: 0,
      description: 'Free 그룹 - 무료 사용자',
    },
    create: {
      groupName: 'free',
      monthlyProjectLimit: 3,
      monthlyPresentationLimit: 0,
      description: 'Free 그룹 - 무료 사용자',
    },
  });
  console.log('✓ Free policy updated: 3 solutions, 0 PT reports');

  // Update or create Pro policy
  await prisma.groupPolicy.upsert({
    where: { groupName: 'pro' },
    update: {
      monthlyProjectLimit: 15,
      monthlyPresentationLimit: 1,
      description: 'Pro 그룹 - 유료 구독 사용자',
    },
    create: {
      groupName: 'pro',
      monthlyProjectLimit: 15,
      monthlyPresentationLimit: 1,
      description: 'Pro 그룹 - 유료 구독 사용자',
    },
  });
  console.log('✓ Pro policy updated: 15 solutions, 1 PT report');

  // Update or create Admin policy
  await prisma.groupPolicy.upsert({
    where: { groupName: 'admin' },
    update: {
      monthlyProjectLimit: 999999,
      monthlyPresentationLimit: 999999,
      description: '관리자 그룹 - 무제한 솔루션 및 PT레포트 생성',
    },
    create: {
      groupName: 'admin',
      monthlyProjectLimit: 999999,
      monthlyPresentationLimit: 999999,
      description: '관리자 그룹 - 무제한 솔루션 및 PT레포트 생성',
    },
  });
  console.log('✓ Admin policy updated: unlimited solutions and PT reports');

  console.log('\n✅ All policies updated successfully!');
}

main()
  .catch((e) => {
    console.error('Error updating policies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
