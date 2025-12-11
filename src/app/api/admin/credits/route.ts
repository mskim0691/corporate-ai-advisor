import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';
import { modifyUserCredits } from '@/lib/credits';

// POST /api/admin/credits - Grant or deduct credits to/from a user
export async function POST(request: Request) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, amount, description } = body;

    if (!userId || amount === undefined) {
      return NextResponse.json(
        { error: '사용자 ID와 크레딧 양은 필수입니다.' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json(
        { error: '유효한 크레딧 양을 입력해주세요.' },
        { status: 400 }
      );
    }

    const type = amount > 0 ? 'admin_grant' : 'admin_deduct';
    const result = await modifyUserCredits(
      userId,
      amount,
      type,
      description || (amount > 0 ? '관리자 크레딧 지급' : '관리자 크레딧 차감'),
      undefined,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      newBalance: result.user.credits,
      transaction: result.transaction,
    });
  } catch (error: any) {
    console.error('Error modifying credits:', error);
    return NextResponse.json(
      { error: error.message || '크레딧 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
