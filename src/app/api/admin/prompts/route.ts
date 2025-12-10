import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

/**
 * GET /api/admin/prompts
 * Get all prompts
 */
export async function GET() {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error("Failed to fetch prompts:", error)
    return NextResponse.json(
      { error: "프롬프트 목록을 가져오는데 실패했습니다" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/prompts
 * Create a new prompt
 */
export async function POST(request: Request) {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { name, content, description } = await request.json()

    if (!name || !content) {
      return NextResponse.json(
        { error: "이름과 내용은 필수입니다" },
        { status: 400 }
      )
    }

    const prompt = await prisma.prompt.create({
      data: { name, content, description }
    })

    return NextResponse.json({ prompt })
  } catch (error) {
    console.error("Failed to create prompt:", error)
    return NextResponse.json(
      { error: "프롬프트 생성에 실패했습니다" },
      { status: 500 }
    )
  }
}
