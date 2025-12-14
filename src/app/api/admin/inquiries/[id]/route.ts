import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// PATCH /api/admin/inquiries/[id] - Reply to inquiry (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await req.json()
    const { reply } = body

    if (!reply) {
      return NextResponse.json(
        { error: "답변 내용을 입력해주세요" },
        { status: 400 }
      )
    }

    // Update inquiry with reply
    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        reply: reply.trim(),
        repliedAt: new Date(),
        status: "answered",
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      inquiry,
    })
  } catch (error) {
    console.error("Reply to inquiry error:", error)
    return NextResponse.json(
      { error: "답변 등록 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
