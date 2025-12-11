import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

// GET /api/admin/pricing-plans/[id] - Get a specific pricing plan
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const { id } = await params;
    const plan = await prisma.pricingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json(
        { error: '가격 플랜을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching pricing plan:', error);
    return NextResponse.json(
      { error: '가격 플랜을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/pricing-plans/[id] - Update a pricing plan
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Convert features array to JSON string if it's an array
    if (body.features && Array.isArray(body.features)) {
      body.features = JSON.stringify(body.features);
    }

    const updateData: any = {};
    const allowedFields = [
      'name',
      'displayName',
      'price',
      'originalPrice',
      'currency',
      'monthlyAnalysis',
      'features',
      'isPopular',
      'isActive',
      'displayOrder',
      'badgeText',
      'badgeColor',
      'buttonText',
      'buttonVariant',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const plan = await prisma.pricingPlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating pricing plan:', error);
    return NextResponse.json(
      { error: '가격 플랜을 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/pricing-plans/[id] - Delete a pricing plan
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const { id } = await params;
    await prisma.pricingPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing plan:', error);
    return NextResponse.json(
      { error: '가격 플랜을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
