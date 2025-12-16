import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/banners - Get active banners for public display
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: '배너를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
