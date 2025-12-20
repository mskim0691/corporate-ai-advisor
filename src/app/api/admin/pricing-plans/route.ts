import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

// GET /api/admin/pricing-plans - Get all pricing plans (admin view)
export async function GET(request: Request) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const plans = await prisma.pricingPlan.findMany({
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    return NextResponse.json(
      { error: '가격 플랜을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/admin/pricing-plans - Create a new pricing plan
export async function POST(request: Request) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const {
      name,
      displayName,
      price,
      originalPrice,
      currency,
      monthlyAnalysis,
      monthlyPresentation,
      features,
      isPopular,
      isActive,
      displayOrder,
      badgeText,
      badgeColor,
      buttonText,
      buttonVariant,
    } = body;

    if (!name || !displayName || price === undefined || monthlyAnalysis === undefined) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // Convert features array to JSON string if it's an array
    const featuresString = Array.isArray(features) ? JSON.stringify(features) : features;

    const plan = await prisma.pricingPlan.create({
      data: {
        name,
        displayName,
        price,
        originalPrice,
        currency: currency || 'KRW',
        monthlyAnalysis,
        monthlyPresentation: monthlyPresentation ?? 0,
        features: featuresString,
        isPopular: isPopular ?? false,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0,
        badgeText,
        badgeColor,
        buttonText: buttonText || '시작하기',
        buttonVariant: buttonVariant || 'default',
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing plan:', error);
    return NextResponse.json(
      { error: '가격 플랜을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
