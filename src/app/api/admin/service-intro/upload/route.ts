import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import crypto from "crypto"

export const runtime = 'nodejs'
export const maxDuration = 60

// Conditionally import supabase only if env vars are present
const USE_SUPABASE = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
let supabase: ReturnType<typeof import("@/lib/supabase").supabase> | null = null

if (USE_SUPABASE) {
  const { supabase: supabaseClient } = require("@/lib/supabase")
  supabase = supabaseClient
}

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
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드 가능합니다" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "png"
    const sanitizedFilename = `${Date.now()}_${crypto.randomUUID()}.${fileExtension}`
    const filePath = `service-intro/${sanitizedFilename}`

    if (!USE_SUPABASE || !supabase) {
      return NextResponse.json(
        { error: "스토리지가 설정되지 않았습니다" },
        { status: 500 }
      )
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Supabase upload error:", error)
      return NextResponse.json(
        { error: "이미지 업로드에 실패했습니다" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("uploads")
      .getPublicUrl(data.path)

    return NextResponse.json({ url: publicData.publicUrl })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: "이미지 업로드 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
