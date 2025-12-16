import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

// GET /api/admin/banners - Get all banners (admin view)
export async function GET() {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const banners = await prisma.banner.findMany({
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

// POST /api/admin/banners - Create a new banner
export async function POST(request: Request) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const {
      title,
      subtitle,
      description,
      buttonText,
      buttonLink,
      imageUrl,
      bgColor,
      textColor,
      order,
      isActive
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: '제목은 필수입니다.' },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle: subtitle || null,
        description: description || null,
        buttonText: buttonText || null,
        buttonLink: buttonLink || null,
        imageUrl: imageUrl || null,
        bgColor: bgColor || null,
        textColor: textColor || null,
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { error: '배너를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
