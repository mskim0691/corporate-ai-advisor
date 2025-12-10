import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

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

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    // Get PDF from form data
    const formData = await req.formData()
    const pdfFile = formData.get('pdf') as File

    if (!pdfFile) {
      return NextResponse.json(
        { error: "PDF 파일이 없습니다" },
        { status: 400 }
      )
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', session.user.id, id)
    await mkdir(uploadDir, { recursive: true })

    // Save PDF file
    const timestamp = Date.now()
    const pdfFilename = `${timestamp}_report.pdf`
    const pdfPath = path.join(uploadDir, pdfFilename)

    const arrayBuffer = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(pdfPath, buffer)

    // Update pdfUrl in database
    const relativePdfPath = `uploads/${session.user.id}/${id}/${pdfFilename}`
    await prisma.report.update({
      where: { projectId: id },
      data: { pdfUrl: relativePdfPath },
    })

    return NextResponse.json({ pdfUrl: relativePdfPath })
  } catch (error) {
    console.error("PDF upload error:", error)
    return NextResponse.json(
      { error: "PDF 업로드 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
