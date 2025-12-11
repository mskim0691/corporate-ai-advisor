const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing group policies...');

  // Create or update default policies
  const policies = [
    {
      groupName: 'admin',
      monthlyProjectLimit: 999999,
      description: '관리자 그룹 - 무제한 프로젝트 생성',
    },
    {
      groupName: 'pro',
      monthlyProjectLimit: 10,
      description: 'Pro 그룹 - 월 10개 프로젝트',
    },
    {
      groupName: 'free',
      monthlyProjectLimit: 3,
      description: 'Free 그룹 - 월 3개 프로젝트',
    },
  ];

  for (const policy of policies) {
    const result = await prisma.groupPolicy.upsert({
      where: { groupName: policy.groupName },
      update: {
        monthlyProjectLimit: policy.monthlyProjectLimit,
        description: policy.description,
      },
      create: policy,
    });
    console.log(`✓ ${policy.groupName} policy created/updated:`, result);
  }

  console.log('Group policies initialized successfully!');
}

main()
  .catch((e) => {
    console.error('Error initializing policies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
