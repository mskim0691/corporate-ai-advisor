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

    const uploadedFiles = []
    const userId = session.user.id

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Sanitize filename: remove Korean characters and special chars
      // Use UUID for storage, but keep original filename in database
      const fileExtension = path.extname(file.name)
      const sanitizedFilename = `${Date.now()}_${crypto.randomUUID()}${fileExtension}`
      const filePath = `${userId}/${id}/${sanitizedFilename}`

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
      {
        error: "파일 업로드 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
