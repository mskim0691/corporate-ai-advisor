import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/admin/inquiries - Get all inquiries (admin only)
export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 })
    }

    const inquiries = await prisma.inquiry.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // pending first
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json({ inquiries })
  } catch (error) {
    console.error("Get admin inquiries error:", error)
    return NextResponse.json(
      { error: "문의 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
