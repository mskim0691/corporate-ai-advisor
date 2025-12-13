import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

// GET /api/admin/policies - Get all group policies
export async function GET(request: Request) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const policies = await prisma.groupPolicy.findMany({
      orderBy: {
        groupName: 'asc',
      },
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { error: '정책 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/admin/policies - Create or update a group policy
export async function POST(request: Request) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const { groupName, monthlyProjectLimit, monthlyPresentationLimit, description } = body;

    if (!groupName || monthlyProjectLimit === undefined) {
      return NextResponse.json(
        { error: '그룹명과 월간 솔루션 제한은 필수입니다.' },
        { status: 400 }
      );
    }

    // Validate groupName
    if (!['admin', 'pro', 'free'].includes(groupName)) {
      return NextResponse.json(
        { error: '그룹명은 admin, pro, free 중 하나여야 합니다.' },
        { status: 400 }
      );
    }

    // Validate monthlyProjectLimit
    if (typeof monthlyProjectLimit !== 'number' || monthlyProjectLimit < 0) {
      return NextResponse.json(
        { error: '월간 솔루션 제한은 0 이상의 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    // Validate monthlyPresentationLimit
    if (monthlyPresentationLimit !== undefined && (typeof monthlyPresentationLimit !== 'number' || monthlyPresentationLimit < 0)) {
      return NextResponse.json(
        { error: '월간 PT레포트 제한은 0 이상의 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    // Upsert the policy
    const policy = await prisma.groupPolicy.upsert({
      where: { groupName },
      update: {
        monthlyProjectLimit,
        monthlyPresentationLimit: monthlyPresentationLimit ?? 0,
        description,
      },
      create: {
        groupName,
        monthlyProjectLimit,
        monthlyPresentationLimit: monthlyPresentationLimit ?? 0,
        description,
      },
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Error creating/updating policy:', error);
    return NextResponse.json(
      { error: '정책을 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
