import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET: Fetch current initial credit policy
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
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

    const policy = await prisma.initialCreditPolicy.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      policy: policy || { credits: 0, description: null }
    })
  } catch (error) {
    console.error("Get initial credit policy error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// POST: Create or update initial credit policy
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
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

    const body = await req.json()
    const { credits, description } = body

    if (typeof credits !== 'number' || credits < 0) {
      return NextResponse.json(
        { error: "유효하지 않은 크레딧 값입니다" },
        { status: 400 }
      )
    }

    // Deactivate all existing policies
    await prisma.initialCreditPolicy.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // Create new policy
    const newPolicy = await prisma.initialCreditPolicy.create({
      data: {
        credits,
        description,
        isActive: true,
      },
    })

    return NextResponse.json({
      policy: newPolicy,
      message: "초기 크레딧 정책이 업데이트되었습니다"
    })
  } catch (error) {
    console.error("Update initial credit policy error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
