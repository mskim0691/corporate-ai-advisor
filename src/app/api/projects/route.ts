import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { getCurrentYearMonth } from "@/lib/utils"

const projectSchema = z.object({
  companyName: z.string().min(1),
  businessNumber: z.string().optional(),
  representative: z.string().min(1),
  industry: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = projectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "유효하지 않은 입력입니다" },
        { status: 400 }
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (subscription?.plan === "free") {
      const yearMonth = getCurrentYearMonth()
      const usageLog = await prisma.usageLog.findUnique({
        where: {
          userId_yearMonth: {
            userId: session.user.id,
            yearMonth,
          },
        },
      })

      if (usageLog && usageLog.count >= 2) {
        return NextResponse.json(
          { error: "이번 달 무료 사용량을 초과했습니다" },
          { status: 403 }
        )
      }
    }

    const { companyName, businessNumber, representative, industry } = parsed.data

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        companyName,
        businessNumber: businessNumber || "",
        representative,
        industry,
        status: "pending",
      },
    })

    return NextResponse.json({ projectId: project.id }, { status: 201 })
  } catch (error) {
    console.error("Project creation error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { files: true },
        },
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Projects fetch error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
