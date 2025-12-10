import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

/**
 * GET /api/admin/users/[id]
 * Get detailed user information
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  const { id } = await params

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        usageLogs: {
          orderBy: { yearMonth: 'desc' }
        },
        projects: {
          include: {
            _count: {
              select: { files: true }
            },
            report: {
              select: {
                id: true,
                createdAt: true,
                viewCount: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return NextResponse.json(
      { error: "사용자 정보를 가져오는데 실패했습니다" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user information (role, subscription, etc.)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  const { id } = await params

  try {
    const body = await request.json()
    const { role, subscriptionPlan } = body

    const updateData: any = {}
    if (role) updateData.role = role

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { subscription: true }
    })

    // Update subscription if provided
    if (subscriptionPlan && user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: { plan: subscriptionPlan }
      })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Failed to update user:", error)
    return NextResponse.json(
      { error: "사용자 정보 업데이트에 실패했습니다" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user account
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  const { id } = await params

  try {
    // Prisma의 cascade 설정으로 관련 데이터가 자동으로 삭제됩니다
    // (subscription, usageLogs, projects, paymentLogs 등)
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "회원이 성공적으로 삭제되었습니다"
    })
  } catch (error) {
    console.error("Failed to delete user:", error)
    return NextResponse.json(
      { error: "회원 삭제에 실패했습니다" },
      { status: 500 }
    )
  }
}
