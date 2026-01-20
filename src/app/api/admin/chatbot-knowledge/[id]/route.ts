import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET - Get single knowledge entry
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const knowledge = await prisma.chatbotKnowledge.findUnique({
      where: { id }
    })

    if (!knowledge) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(knowledge)
  } catch (error) {
    console.error("Failed to fetch chatbot knowledge:", error)
    return NextResponse.json(
      { error: "Failed to fetch chatbot knowledge" },
      { status: 500 }
    )
  }
}

// PATCH - Update knowledge entry
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      category,
      subcategory,
      question,
      answer,
      source,
      sourceUrl,
      keywords,
      isActive,
      lastUpdated
    } = body

    const knowledge = await prisma.chatbotKnowledge.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(subcategory !== undefined && { subcategory: subcategory || null }),
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(source !== undefined && { source }),
        ...(sourceUrl !== undefined && { sourceUrl: sourceUrl || null }),
        ...(keywords !== undefined && { keywords }),
        ...(isActive !== undefined && { isActive }),
        ...(lastUpdated !== undefined && { lastUpdated })
      }
    })

    return NextResponse.json(knowledge)
  } catch (error) {
    console.error("Failed to update chatbot knowledge:", error)
    return NextResponse.json(
      { error: "Failed to update chatbot knowledge" },
      { status: 500 }
    )
  }
}

// DELETE - Delete knowledge entry
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    await prisma.chatbotKnowledge.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete chatbot knowledge:", error)
    return NextResponse.json(
      { error: "Failed to delete chatbot knowledge" },
      { status: 500 }
    )
  }
}
