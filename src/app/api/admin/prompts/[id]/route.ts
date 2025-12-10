import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

/**
 * GET /api/admin/prompts/[id]
 * Get a specific prompt
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  const { id } = await params

  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id }
    })

    if (!prompt) {
      return NextResponse.json(
        { error: "프롬프트를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    return NextResponse.json({ prompt })
  } catch (error) {
    console.error("Failed to fetch prompt:", error)
    return NextResponse.json(
      { error: "프롬프트를 가져오는데 실패했습니다" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/prompts/[id]
 * Update a prompt
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  const { id } = await params

  try {
    const { name, content, description } = await request.json()

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (content !== undefined) updateData.content = content
    if (description !== undefined) updateData.description = description

    const prompt = await prisma.prompt.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ prompt })
  } catch (error) {
    console.error("Failed to update prompt:", error)
    return NextResponse.json(
      { error: "프롬프트 업데이트에 실패했습니다" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/prompts/[id]
 * Delete a prompt
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  const { id } = await params

  try {
    await prisma.prompt.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete prompt:", error)
    return NextResponse.json(
      { error: "프롬프트 삭제에 실패했습니다" },
      { status: 500 }
    )
  }
}
