import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { analyzeCompanyText, uploadFileToGemini } from "@/lib/gemini"

interface UploadedFile {
  file: Awaited<ReturnType<typeof uploadFileToGemini>>
  filename: string
}

export const maxDuration = 300 // 5 minutes timeout

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
    const body = await req.json()
    const { supplementaryInfo } = body

    if (!supplementaryInfo || supplementaryInfo.trim().length === 0) {
      return NextResponse.json(
        { error: "보완 정보를 입력해주세요" },
        { status: 400 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    const isAdmin = user?.role === "admin"

    const project = await prisma.project.findFirst({
      where: isAdmin ? { id } : {
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

    if (!project.report) {
      return NextResponse.json(
        { error: "분석 결과가 없습니다" },
        { status: 400 }
      )
    }

    // Check regeneration count (max 1 time)
    if (project.report.regenerationCount >= 1) {
      return NextResponse.json(
        { error: "솔루션 재생성은 1회만 가능합니다" },
        { status: 400 }
      )
    }

    if (project.files.length === 0) {
      return NextResponse.json(
        { error: "분석할 파일이 없습니다" },
        { status: 400 }
      )
    }

    // Save supplementary info and update regeneration count
    await prisma.report.update({
      where: { id: project.report.id },
      data: {
        supplementaryInfo: supplementaryInfo,
        regenerationCount: project.report.regenerationCount + 1,
      },
    })

    // Upload files to Gemini
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
      // Combine additional request with supplementary info
      const combinedAdditionalRequest = [
        project.report.additionalRequest,
        `\n\n[사용자 보완 정보]\n${supplementaryInfo}`
      ].filter(Boolean).join("")

      // Regenerate solution with supplementary info
      console.log(`🔄 Regenerating solution for ${project.companyName} with supplementary info...`)
      const detailedAnalysisResult = await analyzeCompanyText(
        {
          companyName: project.companyName,
          businessNumber: project.businessNumber,
          representative: project.representative,
          industry: project.industry || undefined,
        },
        uploadedFiles,
        combinedAdditionalRequest
      )

      // Update report with new analysis
      await prisma.report.update({
        where: { id: project.report.id },
        data: {
          textAnalysis: detailedAnalysisResult.analysis,
          // Clear PDF URL since the solution has changed
          pdfUrl: null,
          analysisData: null,
        },
      })

      console.log(`✓ Solution regenerated for ${project.companyName}`)

      return NextResponse.json({
        status: "success",
        textAnalysis: detailedAnalysisResult.analysis,
      })
    } catch (error) {
      console.error("Regeneration error:", error)

      // Revert regeneration count on error
      await prisma.report.update({
        where: { id: project.report.id },
        data: {
          regenerationCount: project.report.regenerationCount,
        },
      })

      return NextResponse.json(
        { error: "솔루션 재생성 중 오류가 발생했습니다" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Regenerate solution API error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
