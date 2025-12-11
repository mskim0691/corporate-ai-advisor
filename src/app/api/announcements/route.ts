import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/announcements - Get active announcements for users
export async function GET(request: Request) {
  try {
    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: { gte: now } },
            ],
          },
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: null },
            ],
          },
          {
            AND: [
              { startDate: null },
              { endDate: { gte: now } },
            ],
          },
          {
            AND: [
              { startDate: null },
              { endDate: null },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: '공지사항을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
