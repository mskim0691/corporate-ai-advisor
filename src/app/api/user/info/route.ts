import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const updateNameSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      name: user.name || "",
      email: user.email,
      plan: user.subscription?.plan || "free",
    })
  } catch (error) {
    console.error("Get user info error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = updateNameSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name } = parsed.data

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
      include: {
        subscription: true,
      },
    })

    return NextResponse.json({
      name: updatedUser.name || "",
      email: updatedUser.email,
      plan: updatedUser.subscription?.plan || "free",
    })
  } catch (error) {
    console.error("Update user name error:", error)
    return NextResponse.json(
      { error: "이름 업데이트 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
