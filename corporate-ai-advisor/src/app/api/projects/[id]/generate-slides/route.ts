import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { generatePresentationSlides } from "@/lib/gemini"

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
