import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { notifyCustomerInquiry } from "@/lib/telegram"

// GET /api/inquiries - Get user's inquiries
export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const inquiries = await prisma.inquiry.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ inquiries })
  } catch (error) {
    console.error("Get inquiries error:", error)
    return NextResponse.json(
      { error: "문의 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// POST /api/inquiries - Create new inquiry
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const body = await req.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용을 모두 입력해주세요" },
        { status: 400 }
      )
    }

    // Get user info for notification
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        content: content.trim(),
      },
    })

    // Send Telegram notification to admin
    try {
      await notifyCustomerInquiry({
        userName: user.name || '이름 없음',
        userEmail: user.email,
        title: inquiry.title,
        content: inquiry.content,
        inquiryId: inquiry.id,
      })
    } catch (telegramError) {
      // Log but don't fail the request if Telegram notification fails
      console.error('Telegram notification failed:', telegramError)
    }

    return NextResponse.json({
      success: true,
      inquiry,
    })
  } catch (error) {
    console.error("Create inquiry error:", error)
    return NextResponse.json(
      { error: "문의 등록 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
