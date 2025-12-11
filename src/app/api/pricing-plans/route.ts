import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pricing-plans - Get active pricing plans for display
export async function GET(request: Request) {
  try {
    const plans = await prisma.pricingPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Parse features JSON string to array
    const plansWithParsedFeatures = plans.map((plan) => ({
      ...plan,
      features: JSON.parse(plan.features),
    }));

    return NextResponse.json(plansWithParsedFeatures);
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    return NextResponse.json(
      { error: '가격 플랜을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
