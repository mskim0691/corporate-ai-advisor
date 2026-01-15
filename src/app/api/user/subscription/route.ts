import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const [subscription, user] = await Promise.all([
      prisma.subscription.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      })
    ])

    return NextResponse.json({
      plan: subscription?.plan || "free",
      status: subscription?.status || "active",
      role: user?.role || "user",
      pendingPlan: subscription?.pendingPlan || null,
      currentPeriodEnd: subscription?.currentPeriodEnd || null,
    })
  } catch (error) {
    console.error("Get subscription error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
