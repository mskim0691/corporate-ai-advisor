import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET - Fetch service intro content
export async function GET() {
  try {
    const serviceIntro = await prisma.serviceIntro.findFirst({
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(serviceIntro || { content: "" })
  } catch (error) {
    console.error("Failed to fetch service intro:", error)
    return NextResponse.json(
      { error: "서비스 소개를 불러오는데 실패했습니다" },
      { status: 500 }
    )
  }
}

// PUT - Update service intro content (admin only)
export async function PUT(req: Request) {
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
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
    }

    const { content } = await req.json()

    // Find existing service intro or create new one
    const existing = await prisma.serviceIntro.findFirst()

    let serviceIntro
    if (existing) {
      serviceIntro = await prisma.serviceIntro.update({
        where: { id: existing.id },
        data: { content },
      })
    } else {
      serviceIntro = await prisma.serviceIntro.create({
        data: { content },
      })
    }

    return NextResponse.json(serviceIntro)
  } catch (error) {
    console.error("Failed to update service intro:", error)
    return NextResponse.json(
      { error: "서비스 소개 저장에 실패했습니다" },
      { status: 500 }
    )
  }
}
