import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

// GET /api/admin/policies/[id] - Get a specific group policy
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
    const policy = await prisma.groupPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      return NextResponse.json(
        { error: '정책을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Error fetching policy:', error);
    return NextResponse.json(
      { error: '정책을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/policies/[id] - Update a group policy
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
    const { monthlyProjectLimit, description } = body;

    if (monthlyProjectLimit !== undefined) {
      if (typeof monthlyProjectLimit !== 'number' || monthlyProjectLimit < 0) {
        return NextResponse.json(
          { error: '월간 프로젝트 제한은 0 이상의 숫자여야 합니다.' },
          { status: 400 }
        );
      }
    }

    const policy = await prisma.groupPolicy.update({
      where: { id },
      data: {
        ...(monthlyProjectLimit !== undefined && { monthlyProjectLimit }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Error updating policy:', error);
    return NextResponse.json(
      { error: '정책을 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/policies/[id] - Delete a group policy
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
    await prisma.groupPolicy.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting policy:', error);
    return NextResponse.json(
      { error: '정책을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
