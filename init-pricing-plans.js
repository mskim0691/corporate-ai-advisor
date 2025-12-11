const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing pricing plans...');

  // Create or update default pricing plans
  const plans = [
    {
      name: 'free',
      displayName: 'Free',
      price: 0,
      originalPrice: null,
      currency: 'KRW',
      monthlyAnalysis: 4,
      features: JSON.stringify(['월 4회 분석', 'PDF 다운로드', '기본 지원']),
      isPopular: false,
      isActive: true,
      displayOrder: 0,
      badgeText: null,
      badgeColor: null,
      buttonText: '무료로 시작하기',
      buttonVariant: 'outline',
    },
    {
      name: 'standard',
      displayName: 'Standard',
      price: 15000,
      originalPrice: 30000,
      currency: 'KRW',
      monthlyAnalysis: 30,
      features: JSON.stringify([
        '월 30회 분석',
        'PDF 다운로드',
        '우선 지원',
        '프리미엄 기능',
      ]),
      isPopular: true,
      isActive: true,
      displayOrder: 1,
      badgeText: '50% 할인 이벤트',
      badgeColor: 'red',
      buttonText: '지금 시작하기',
      buttonVariant: 'default',
    },
  ];

  for (const plan of plans) {
    const result = await prisma.pricingPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`✓ ${plan.displayName} plan created/updated:`, result.id);
  }

  console.log('Pricing plans initialized successfully!');
}

main()
  .catch((e) => {
    console.error('Error initializing pricing plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
