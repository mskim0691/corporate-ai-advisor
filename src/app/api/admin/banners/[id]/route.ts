import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

// GET /api/admin/banners/[id] - Get a specific banner
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const { id } = await params;
    const banner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      return NextResponse.json(
        { error: '배너를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json(
      { error: '배너를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/banners/[id] - Update a banner
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const { id } = await params;
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

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle || null;
    if (description !== undefined) updateData.description = description || null;
    if (buttonText !== undefined) updateData.buttonText = buttonText || null;
    if (buttonLink !== undefined) updateData.buttonLink = buttonLink || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (bgColor !== undefined) updateData.bgColor = bgColor || null;
    if (textColor !== undefined) updateData.textColor = textColor || null;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const banner = await prisma.banner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { error: '배너를 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banners/[id] - Delete a banner
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResponse = await requireAdmin();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const { id } = await params;
    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { error: '배너를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
