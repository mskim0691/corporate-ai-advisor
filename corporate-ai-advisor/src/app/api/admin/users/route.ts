import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

/**
 * GET /api/admin/users
 * Get all users with their subscriptions and project counts
 */
export async function GET() {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const users = await prisma.user.findMany({
      include: {
        subscription: true,
        _count: {
          select: {
            projects: true,
            usageLogs: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format the response
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      subscription: {
        plan: user.subscription?.plan || 'free',
        status: user.subscription?.status || 'active',
        currentPeriodEnd: user.subscription?.currentPeriodEnd
      },
      stats: {
        projectCount: user._count.projects,
        usageLogCount: user._count.usageLogs
      }
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json(
      { error: "사용자 목록을 가져오는데 실패했습니다" },
      { status: 500 }
    )
  }
}
