import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET - List all chatbot knowledge entries
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const knowledge = await prisma.chatbotKnowledge.findMany({
      orderBy: [
        { category: "asc" },
        { subcategory: "asc" },
        { createdAt: "desc" }
      ]
    })

    return NextResponse.json(knowledge)
  } catch (error) {
    console.error("Failed to fetch chatbot knowledge:", error)
    return NextResponse.json(
      { error: "Failed to fetch chatbot knowledge" },
      { status: 500 }
    )
  }
}

// POST - Create new chatbot knowledge entry
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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

    if (!category || !question || !answer || !source || !keywords || !lastUpdated) {
      return NextResponse.json(
        { error: "필수 항목을 입력해주세요" },
        { status: 400 }
      )
    }

    const knowledge = await prisma.chatbotKnowledge.create({
      data: {
        category,
        subcategory: subcategory || null,
        question,
        answer,
        source,
        sourceUrl: sourceUrl || null,
        keywords,
        isActive: isActive ?? true,
        lastUpdated
      }
    })

    return NextResponse.json(knowledge)
  } catch (error) {
    console.error("Failed to create chatbot knowledge:", error)
    return NextResponse.json(
      { error: "Failed to create chatbot knowledge" },
      { status: 500 }
    )
  }
}
