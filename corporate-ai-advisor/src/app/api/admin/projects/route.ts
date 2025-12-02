import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

/**
 * GET /api/admin/projects
 * Get all projects with user info and files
 */
export async function GET() {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const projects = await prisma.project.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
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
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to latest 100 projects
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json(
      { error: "프로젝트 목록을 가져오는데 실패했습니다" },
      { status: 500 }
    )
  }
}
