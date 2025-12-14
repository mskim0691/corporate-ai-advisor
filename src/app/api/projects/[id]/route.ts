import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    // Admin can view any project, regular users can only view their own
    const project = await prisma.project.findFirst({
      where: user?.role === 'admin' ? { id } : {
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

    return NextResponse.json({
      id: project.id,
      companyName: project.companyName,
      businessNumber: project.businessNumber,
      representative: project.representative,
      industry: project.industry,
      status: project.status,
      createdAt: project.createdAt,
      report: project.report ? {
        initialRiskAnalysis: project.report.initialRiskAnalysis,
        additionalRequest: project.report.additionalRequest,
        textAnalysis: project.report.textAnalysis,
        analysisData: project.report.analysisData,
        pdfUrl: project.report.pdfUrl,
      } : null,
    })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const { additionalRequest } = body

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

    // 리포트가 없으면 생성
    if (!project.report) {
      await prisma.report.create({
        data: {
          projectId: id,
          additionalRequest: additionalRequest || null,
        },
      })
    } else {
      // 리포트에 추가 분석 요청사항 업데이트
      await prisma.report.update({
        where: { id: project.report.id },
        data: {
          additionalRequest: additionalRequest || null,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json(
      { error: "프로젝트 업데이트 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { id } = await params

    // 프로젝트 조회 (파일 정보 포함)
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        files: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    // 업로드된 파일 디렉토리 삭제
    if (project.files.length > 0) {
      const uploadDir = path.join(process.cwd(), "uploads", session.user.id, id)
      try {
        await fs.rm(uploadDir, { recursive: true, force: true })
        console.log(`✓ Deleted upload directory: ${uploadDir}`)
      } catch (error) {
        console.error("Failed to delete upload directory:", error)
        // 파일 삭제 실패해도 계속 진행
      }
    }

    // 프로젝트 삭제 (cascade로 연관된 files, report도 자동 삭제됨)
    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json(
      { error: "프로젝트 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
