import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/sample-reports - Get all sample report images
export async function GET() {
  try {
    const sampleReports = await prisma.sampleReport.findMany({
      orderBy: { order: 'asc' },
    });

    const images = sampleReports.map(report => report.imageUrl);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching sample reports:', error);
    return NextResponse.json(
      { error: '샘플 이미지를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
