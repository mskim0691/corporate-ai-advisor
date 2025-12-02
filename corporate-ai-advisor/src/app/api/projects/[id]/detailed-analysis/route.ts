import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { analyzeCompanyText, uploadFileToGemini } from "@/lib/gemini"

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

    if (!project.report || !project.report.initialRiskAnalysis) {
      return NextResponse.json(
        { error: "초기 리스크 분석이 완료되지 않았습니다" },
        { status: 400 }
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
      // 1단계: 상세 솔루션 분석 수행 (초기 리스크 분석 포함)
      const detailedAnalysisResult = await analyzeCompanyText(
        {
          companyName: project.companyName,
          businessNumber: project.businessNumber,
          representative: project.representative,
          industry: project.industry || undefined,
        },
        uploadedFiles,
        project.report.initialRiskAnalysis  // 초기 리스크 분석 결과 전달
      )

      // 리포트 업데이트
      await prisma.report.update({
        where: { id: project.report.id },
        data: {
          textAnalysis: detailedAnalysisResult.analysis,
        },
      })

      await prisma.project.update({
        where: { id },
        data: { status: "completed" },
      })

      return NextResponse.json({ status: "completed" })
    } catch (error) {
      console.error("Detailed analysis error:", error)

      await prisma.project.update({
        where: { id },
        data: { status: "failed" },
      })

      return NextResponse.json(
        { error: "상세 분석 중 오류가 발생했습니다" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Detailed analysis API error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
