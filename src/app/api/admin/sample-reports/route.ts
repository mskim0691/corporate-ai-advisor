import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/sample-reports - Get all sample reports with details
export async function GET() {
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

    const sampleReports = await prisma.sampleReport.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ sampleReports });
  } catch (error) {
    console.error('Error fetching sample reports:', error);
    return NextResponse.json(
      { error: '샘플 레포트를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/admin/sample-reports - Create a new sample report
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

    const body = await request.json();
    const { imageUrl, order } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: '이미지 URL이 필요합니다' }, { status: 400 });
    }

    const sampleReport = await prisma.sampleReport.create({
      data: {
        imageUrl,
        order: order ?? 0,
      },
    });

    return NextResponse.json({ sampleReport }, { status: 201 });
  } catch (error) {
    console.error('Error creating sample report:', error);
    return NextResponse.json(
      { error: '샘플 레포트를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/sample-reports - Delete all sample reports (for testing)
export async function DELETE() {
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

    await prisma.sampleReport.deleteMany({});

    return NextResponse.json({ message: '모든 샘플 레포트가 삭제되었습니다' });
  } catch (error) {
    console.error('Error deleting sample reports:', error);
    return NextResponse.json(
      { error: '샘플 레포트를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
