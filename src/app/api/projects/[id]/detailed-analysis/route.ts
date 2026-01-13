import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { analyzeCompanyText, uploadFileToGemini } from "@/lib/gemini"

interface UploadedFile {
  file: Awaited<ReturnType<typeof uploadFileToGemini>>
  filename: string
}

// GET 요청 - 분석 상태 확인
export async function GET(
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
      select: {
        status: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    return NextResponse.json({ status: project.status })
  } catch (error) {
    console.error("Detailed analysis GET error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// POST 요청 - 분석 실행
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

    // 이미 처리 중이거나 완료된 경우 중복 실행 방지
    if (project.status === "processing") {
      return NextResponse.json({ status: "already_processing" }, { status: 200 })
    }

    if (project.status === "completed") {
      return NextResponse.json({ status: "already_completed" }, { status: 200 })
    }

    // report가 없으면 생성
    if (!project.report) {
      await prisma.report.create({
        data: {
          projectId: id,
        },
      })

      // 다시 프로젝트 조회
      const updatedProject = await prisma.project.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
        include: {
          files: true,
          report: true,
        },
      })

      if (!updatedProject) {
        return NextResponse.json(
          { error: "프로젝트를 찾을 수 없습니다" },
          { status: 404 }
        )
      }

      Object.assign(project, updatedProject)
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
      // 1단계: 상세 솔루션 분석 수행
      const detailedAnalysisResult = await analyzeCompanyText(
        {
          companyName: project.companyName,
          businessNumber: project.businessNumber,
          representative: project.representative,
          industry: project.industry || undefined,
        },
        uploadedFiles,
        project.report!.additionalRequest || undefined  // 추가 분석 요청사항 전달
      )

      // 리포트 업데이트
      await prisma.report.update({
        where: { id: project.report!.id },
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
      const errorMessage = error instanceof Error ? error.message : String(error)

      await prisma.project.update({
        where: { id },
        data: { status: "failed" },
      })

      return NextResponse.json(
        { error: "상세 분석 중 오류가 발생했습니다", details: errorMessage },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Detailed analysis API error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다", details: errorMessage },
      { status: 500 }
    )
  }
}
