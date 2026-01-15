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

    // 쿠폰 사용자 만료 체크: billingKey 없이 currentPeriodEnd가 지난 경우 free로 처리
    let effectivePlan = subscription?.plan || "free"
    let effectiveStatus = subscription?.status || "active"

    if (
      subscription &&
      subscription.currentPeriodEnd &&
      new Date() > subscription.currentPeriodEnd &&
      !subscription.billingKey
    ) {
      // 만료된 쿠폰 사용자 - DB도 업데이트
      effectivePlan = "free"
      effectiveStatus = "expired"

      // DB 업데이트 (비동기로 처리, 응답 지연 방지)
      prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          plan: "free",
          status: "expired",
        },
      }).catch((err) => console.error("Failed to update expired subscription:", err))
    }

    return NextResponse.json({
      plan: effectivePlan,
      status: effectiveStatus,
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
