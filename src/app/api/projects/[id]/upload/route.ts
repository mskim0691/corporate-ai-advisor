import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import path from "path"
import fs from "fs/promises"
import crypto from "crypto"

// Route segment config to increase body size limit
export const runtime = 'nodejs'
export const maxDuration = 60 // Maximum allowed execution time in seconds
export const dynamic = 'force-dynamic'

// Conditionally import supabase only if env vars are present
const USE_SUPABASE = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
let supabase: any = null

console.log('Upload route - Environment check:', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET',
  USE_SUPABASE
})

if (USE_SUPABASE) {
  const { supabase: supabaseClient } = require("@/lib/supabase")
  supabase = supabaseClient
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { id } = await params

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

    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { error: "파일이 없습니다" },
        { status: 400 }
      )
    }

    // 파일 타입/사이즈 검증
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/msword', // doc
      'application/vnd.ms-excel', // xls
      'image/jpeg',
      'image/png',
      'image/jpg',
    ]
    const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB
    const MAX_FILES = 5

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `파일은 최대 ${MAX_FILES}개까지 업로드할 수 있습니다` },
        { status: 400 }
      )
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `허용되지 않는 파일 형식입니다: ${file.name}. PDF, DOCX, XLSX, JPG, PNG만 가능합니다.` },
          { status: 400 }
        )
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `파일 크기가 4MB를 초과합니다: ${file.name}` },
          { status: 400 }
        )
      }
    }

    const uploadedFiles = []
    const userId = session.user.id

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Sanitize filename: use UUID for storage to avoid any special character issues
      // Keep original filename in database for display
      // Also sanitize file extension to remove any problematic characters
      const rawExtension = path.extname(file.name)
      const fileExtension = rawExtension.toLowerCase().replace(/[^a-z0-9.]/g, '')
      const sanitizedFilename = `${Date.now()}_${crypto.randomUUID()}${fileExtension}`
      const filePath = `${userId}/${id}/${sanitizedFilename}`

      console.log(`📁 Uploading file: original="${file.name}", sanitized="${sanitizedFilename}", path="${filePath}"`)

      if (USE_SUPABASE) {
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from("uploads")
          .upload(filePath, buffer, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          })

        if (error) {
          console.error("Supabase upload error:", error)
          throw new Error(`Supabase에 ${file.name} 파일 업로드를 실패했습니다.`)
        }

        // Save file metadata to our database
        const fileRecord = await prisma.file.create({
          data: {
            projectId: id,
            filename: file.name,
            filePath: data.path,
            fileType: file.type,
            fileSize: file.size,
          },
        })

        uploadedFiles.push(fileRecord)
      } else {
        // Local file storage for development
        const uploadDir = process.env.UPLOAD_DIR || "./uploads"
        const fullPath = path.join(process.cwd(), uploadDir, filePath)
        const dir = path.dirname(fullPath)

        // Create directory if it doesn't exist
        await fs.mkdir(dir, { recursive: true })

        // Write file to disk
        await fs.writeFile(fullPath, buffer)

        console.log(`✓ File saved locally: ${fullPath}`)

        // Save file metadata to our database
        const fileRecord = await prisma.file.create({
          data: {
            projectId: id,
            filename: file.name,
            filePath: filePath,
            fileType: file.type,
            fileSize: file.size,
          },
        })

        uploadedFiles.push(fileRecord)
      }
    }

    return NextResponse.json({ files: uploadedFiles }, { status: 201 })
  } catch (error) {
    console.error("File upload error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      USE_SUPABASE,
      hasSupabaseClient: !!supabase
    })
    return NextResponse.json(
      { error: "파일 업로드 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
