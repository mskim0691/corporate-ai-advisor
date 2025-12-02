import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { analyzeInitialRisk, uploadFileToGemini } from "@/lib/gemini"
import { getCurrentYearMonth } from "@/lib/utils"

interface UploadedFile {
  file: Awaited<ReturnType<typeof uploadFileToGemini>>
  filename: string
}

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

    let additionalRequest: string | undefined
    try {
      const body = await req.json()
      additionalRequest = body?.additionalRequest
    } catch (error) {
      // Body is empty or invalid JSON, that's okay
      additionalRequest = undefined
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        files: true,
        report: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    if (project.files.length === 0) {
      return NextResponse.json(
        { error: "분석할 파일이 없습니다" },
        { status: 400 }
      )
    }

    await prisma.project.update({
      where: { id },
      data: { status: "processing" },
    })

    // 파일을 Gemini에 업로드
    const uploadedFiles: UploadedFile[] = []
    for (const file of project.files) {
      try {
        const geminiFile = await uploadFileToGemini(file.filePath, file.fileType || "application/octet-stream")
        uploadedFiles.push({
          file: geminiFile,
          filename: file.filename
        })
      } catch (error) {
        console.error(`Error uploading ${file.filename} to Gemini:`, error)
      }
    }

    try {
      // 0단계: 초기 리스크 분석 수행
      const initialRiskResult = await analyzeInitialRisk(
        {
          companyName: project.companyName,
          businessNumber: project.businessNumber,
          representative: project.representative,
          industry: project.industry || undefined,
        },
        uploadedFiles,
        additionalRequest
      )

      // 리포트 업데이트 또는 생성
      if (project.report) {
        await prisma.report.update({
          where: { id: project.report.id },
          data: {
            initialRiskAnalysis: initialRiskResult.analysis,
            additionalRequest: additionalRequest || null,
          },
        })
      } else {
        await prisma.report.create({
          data: {
            projectId: id,
            initialRiskAnalysis: initialRiskResult.analysis,
            additionalRequest: additionalRequest || null,
          },
        })
      }

      await prisma.project.update({
        where: { id },
        data: { status: "completed" },
      })

      // 사용량 카운트는 최초 분석 시에만 증가
      if (!project.report) {
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
      }

      return NextResponse.json({ status: "completed" })
    } catch (error) {
      console.error("Analysis error:", error)

      await prisma.project.update({
        where: { id },
        data: { status: "failed" },
      })

      return NextResponse.json(
        { error: "분석 중 오류가 발생했습니다" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Analyze API error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
