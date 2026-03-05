import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating pricing plans with monthlyVisualReport...');

  // Update Free plan
  const freePlan = await prisma.pricingPlan.findUnique({
    where: { name: 'free' },
  });

  if (freePlan) {
    await prisma.pricingPlan.update({
      where: { name: 'free' },
      data: {
        monthlyVisualReport: 1,
      },
    });
    console.log('✓ Updated free plan: monthlyVisualReport = 1');
  }

  // Update Pro plan
  const proPlan = await prisma.pricingPlan.findUnique({
    where: { name: 'pro' },
  });

  if (proPlan) {
    await prisma.pricingPlan.update({
      where: { name: 'pro' },
      data: {
        monthlyVisualReport: 15,
      },
    });
    console.log('✓ Updated pro plan: monthlyVisualReport = 15');
  }

  // Update Expert plan
  const expertPlan = await prisma.pricingPlan.findUnique({
    where: { name: 'expert' },
  });

  if (expertPlan) {
    await prisma.pricingPlan.update({
      where: { name: 'expert' },
      data: {
        monthlyVisualReport: 100,
      },
    });
    console.log('✓ Updated expert plan: monthlyVisualReport = 100');
  }

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
