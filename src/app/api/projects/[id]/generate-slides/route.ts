import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { generatePresentationSlides } from "@/lib/gemini"
import { hasEnoughCredits, deductPresentationCredits, getCreditPrice } from "@/lib/credits"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        report: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    if (!project.report?.textAnalysis) {
      return NextResponse.json(
        { error: "텍스트 분석 결과가 없습니다" },
        { status: 400 }
      )
    }

    // Check if user is admin - admins don't need to pay credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdmin = user?.role === "admin"

    // If not admin, check credits before generating presentation
    if (!isAdmin) {
      const creditCost = await getCreditPrice('premium_presentation')
      const enoughCredits = await hasEnoughCredits(session.user.id, creditCost)

      if (!enoughCredits) {
        return NextResponse.json(
          { error: `크레딧이 부족합니다. 고급 프레젠테이션 제작에는 ${creditCost} 크레딧이 필요합니다.` },
          { status: 403 }
        )
      }
    }

    try {
      const presentationResult = await generatePresentationSlides(
        project.report.textAnalysis,
        project.companyName
      )

      await prisma.report.update({
        where: { id: project.report.id },
        data: {
          analysisData: JSON.stringify(presentationResult),
        },
      })

      // Deduct credits only for non-admin users after successful generation
      if (!isAdmin) {
        try {
          await deductPresentationCredits(session.user.id, project.id)
        } catch (error) {
          console.error("Failed to deduct presentation credits:", error)
          // Note: We don't rollback the presentation since it was already created
          // This is a business decision - the presentation is created but credits might not be deducted
        }
      }

      return NextResponse.json({ status: "success" })
    } catch (error) {
      console.error("Presentation generation error:", error)
      return NextResponse.json(
        { error: "프레젠테이션 생성 중 오류가 발생했습니다" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Generate slides API error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
