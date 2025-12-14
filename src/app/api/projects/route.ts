import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { getCurrentYearMonth } from "@/lib/utils"
import { checkProjectCreationPolicy } from "@/lib/policy"
// import { hasEnoughCredits, deductAnalysisCredits, getCreditPrice } from "@/lib/credits" // 크레딧 기능 비활성화

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

    // Get user info with subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    // Check project creation policy based on user's group
    const policyCheck = await checkProjectCreationPolicy(
      user.id,
      user.role,
      user.subscription?.plan
    )

    if (!policyCheck.allowed) {
      return NextResponse.json(
        { error: policyCheck.message || "프로젝트 생성 제한을 초과했습니다" },
        { status: 403 }
      )
    }

    /* 크레딧 기능 비활성화
    // Check if user has enough credits
    const creditCost = await getCreditPrice('basic_analysis')
    const enoughCredits = await hasEnoughCredits(user.id, creditCost)

    if (!enoughCredits) {
      return NextResponse.json(
        { error: `크레딧이 부족합니다. 분석에는 ${creditCost} 크레딧이 필요합니다.` },
        { status: 403 }
      )
    }
    */

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

    /* 크레딧 기능 비활성화
    // Deduct credits for the analysis
    try {
      await deductAnalysisCredits(user.id, project.id)
    } catch (error) {
      // If credit deduction fails, delete the project
      await prisma.project.delete({ where: { id: project.id } })
      throw error
    }
    */

    // Increment usage log for monthly quota tracking
    const yearMonth = getCurrentYearMonth()
    await prisma.usageLog.upsert({
      where: {
        userId_yearMonth: {
          userId: session.user.id,
          yearMonth,
        },
      },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        userId: session.user.id,
        yearMonth,
        count: 1,
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
