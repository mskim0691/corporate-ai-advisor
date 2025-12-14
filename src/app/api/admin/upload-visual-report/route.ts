import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string
    const reportId = formData.get("reportId") as string

    if (!file || !projectId || !reportId) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다" },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "PDF 파일만 업로드 가능합니다" },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "파일 크기는 50MB 이하여야 합니다" },
        { status: 400 }
      )
    }

    // Get project to verify it exists and get user info
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: true,
        report: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    if (!project.report || project.report.id !== reportId) {
      return NextResponse.json(
        { error: "리포트를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "파일 스토리지가 설정되지 않았습니다" },
        { status: 500 }
      )
    }

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create unique filename
    const timestamp = Date.now()
    const sanitizedCompanyName = project.companyName.replace(/[^a-zA-Z0-9가-힣]/g, "_")
    const fileName = `visual-report-${sanitizedCompanyName}-${timestamp}.pdf`
    const filePath = `${project.userId}/${projectId}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return NextResponse.json(
        { error: `파일 업로드 실패: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: "파일 URL 생성 실패" },
        { status: 500 }
      )
    }

    // Update report with PDF URL
    await prisma.report.update({
      where: { id: reportId },
      data: {
        pdfUrl: urlData.publicUrl,
      },
    })

    // Also create a file record in the database for tracking
    await prisma.file.create({
      data: {
        projectId: projectId,
        filename: fileName,
        filePath: urlData.publicUrl,
        fileSize: file.size,
        fileType: "application/pdf",
      },
    })

    return NextResponse.json({
      success: true,
      message: "비주얼 레포트가 성공적으로 업로드되었습니다",
      pdfUrl: urlData.publicUrl,
    })
  } catch (error) {
    console.error("Upload visual report error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
