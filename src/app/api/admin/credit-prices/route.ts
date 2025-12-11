import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

// GET /api/admin/credit-prices - Get all credit prices
export async function GET(request: Request) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const prices = await prisma.creditPrice.findMany({
      orderBy: {
        type: 'asc',
      },
    });

    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error fetching credit prices:', error);
    return NextResponse.json(
      { error: '크레딧 가격을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/admin/credit-prices - Create or update credit price
export async function POST(request: Request) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const { type, name, credits, description, isActive } = body;

    if (!type || !name || credits === undefined) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const price = await prisma.creditPrice.upsert({
      where: { type },
      update: {
        name,
        credits,
        description,
        isActive: isActive ?? true,
      },
      create: {
        type,
        name,
        credits,
        description,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(price);
  } catch (error) {
    console.error('Error creating/updating credit price:', error);
    return NextResponse.json(
      { error: '크레딧 가격을 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
