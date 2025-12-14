import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// DELETE /api/admin/sample-reports/[id] - Delete a specific sample report
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await prisma.sampleReport.delete({
      where: { id },
    });

    return NextResponse.json({ message: '샘플 레포트가 삭제되었습니다' });
  } catch (error) {
    console.error('Error deleting sample report:', error);
    return NextResponse.json(
      { error: '샘플 레포트를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
