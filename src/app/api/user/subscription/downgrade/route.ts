import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    // 현재 구독 정보 조회
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "구독 정보를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    // 이미 free 플랜이면 에러
    if (subscription.plan === "free") {
      return NextResponse.json(
        { error: "이미 Free 플랜을 사용 중입니다" },
        { status: 400 }
      )
    }

    // 빌링키가 있으면 토스페이먼츠에서 해지 처리 (실제로는 DB에서만 삭제해도 됨)
    // 토스페이먼츠는 빌링키 삭제 API가 없어서 DB에서만 삭제하면 자동 결제 중단됨
    const hadBillingKey = !!subscription.billingKey

    // 구독을 free로 변경하고 빌링키 제거
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        plan: "free",
        status: "active",
        billingKey: null,  // 빌링키 제거로 정기결제 중단
        customerKey: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      },
    })

    // 결제 로그에 해지 기록
    if (hadBillingKey) {
      await prisma.paymentLog.create({
        data: {
          userId: session.user.id,
          amount: 0,
          currency: "KRW",
          status: "completed",
          description: `${subscription.plan.toUpperCase()} → Free 플랜 다운그레이드 (정기결제 해지)`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Free 플랜으로 변경되었습니다. 정기결제가 해지되었습니다.",
      previousPlan: subscription.plan,
      newPlan: "free",
    })
  } catch (error) {
    console.error("Downgrade subscription error:", error)
    return NextResponse.json(
      { error: "구독 변경 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
