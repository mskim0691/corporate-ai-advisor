import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserPolicyInfo } from '@/lib/policy';

// GET /api/user/policy - Get current user's policy information
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const policyInfo = await getUserPolicyInfo(session.user.id);

    if (!policyInfo) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json(policyInfo);
  } catch (error) {
    console.error('Error fetching user policy:', error);
    return NextResponse.json(
      { error: '정책 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
