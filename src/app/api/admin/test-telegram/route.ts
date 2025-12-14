import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendTestNotification } from '@/lib/telegram';

// POST /api/admin/test-telegram - Test Telegram notification
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    // Send test notification
    const success = await sendTestNotification();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Telegram 테스트 알림이 전송되었습니다',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Telegram 알림 전송에 실패했습니다. 환경 변수를 확인하세요.',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending test Telegram notification:', error);
    return NextResponse.json(
      { error: 'Telegram 테스트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
