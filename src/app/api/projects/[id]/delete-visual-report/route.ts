import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const USE_SUPABASE = !!(supabaseUrl && supabaseServiceKey)

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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다" },
        { status: 403 }
      )
    }

    // Get project with report
    const project = await prisma.project.findFirst({
      where: { id },
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

    if (!project.report?.pdfUrl) {
      return NextResponse.json(
        { error: "삭제할 비주얼 리포트가 없습니다" },
        { status: 400 }
      )
    }

    const pdfUrl = project.report.pdfUrl

    // Delete file from storage
    if (USE_SUPABASE && supabaseUrl && supabaseServiceKey) {
      // Delete from Supabase Storage
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Extract path from URL
      // URL format: https://{supabase-url}/storage/v1/object/public/uploads/{path}
      const urlObj = new URL(pdfUrl)
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/uploads\/(.+)/)

      if (pathMatch && pathMatch[1]) {
        const storagePath = decodeURIComponent(pathMatch[1])
        const { error: deleteError } = await supabase.storage
          .from("uploads")
          .remove([storagePath])

        if (deleteError) {
          console.error("Supabase delete error:", deleteError)
          // Continue even if file deletion fails
        } else {
          console.log(`✓ Deleted file from Supabase: ${storagePath}`)
        }
      }
    } else {
      // Delete from local filesystem
      const fs = await import("fs/promises")
      const path = await import("path")

      const filePath = path.join(process.cwd(), pdfUrl)
      try {
        await fs.unlink(filePath)
        console.log(`✓ Deleted local file: ${filePath}`)
      } catch (error) {
        console.error("Failed to delete local file:", error)
        // Continue even if file deletion fails
      }
    }

    // Update database to remove PDF URL
    await prisma.report.update({
      where: { id: project.report.id },
      data: {
        pdfUrl: null,
      },
    })

    console.log(`✓ Visual report deleted for project ${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete visual report error:", error)
    return NextResponse.json(
      { error: "비주얼 리포트 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
