import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { targetPlan } = await req.json()

    if (!targetPlan || !['pro', 'expert'].includes(targetPlan)) {
      return NextResponse.json(
        { error: "유효하지 않은 플랜입니다" },
        { status: 400 }
      )
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

    // 빌링키가 없으면 정기결제가 아님
    if (!subscription.billingKey) {
      return NextResponse.json(
        { error: "정기결제 정보가 없습니다. 먼저 구독을 시작해주세요." },
        { status: 400 }
      )
    }

    const planOrder: Record<string, number> = { free: 0, pro: 1, expert: 2 }
    const currentOrder = planOrder[subscription.plan] ?? 0
    const targetOrder = planOrder[targetPlan] ?? 0

    // 업그레이드인지 확인 (pro -> expert)
    if (targetOrder <= currentOrder) {
      return NextResponse.json(
        { error: "업그레이드만 예약할 수 있습니다" },
        { status: 400 }
      )
    }

    // 이미 같은 플랜으로 예약되어 있는지 확인
    if (subscription.pendingPlan === targetPlan) {
      return NextResponse.json(
        { error: "이미 해당 플랜으로 변경이 예약되어 있습니다" },
        { status: 400 }
      )
    }

    // pendingPlan 업데이트
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        pendingPlan: targetPlan,
      },
    })

    // 다음 결제일 계산
    const nextBillingDate = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toLocaleDateString('ko-KR')
      : '다음 결제일'

    return NextResponse.json({
      success: true,
      message: `${targetPlan.toUpperCase()} 플랜으로 변경이 예약되었습니다. ${nextBillingDate}에 변경됩니다.`,
      currentPlan: subscription.plan,
      pendingPlan: targetPlan,
      nextBillingDate,
    })
  } catch (error) {
    console.error("Schedule upgrade error:", error)
    return NextResponse.json(
      { error: "플랜 변경 예약 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// 예약된 업그레이드 취소
export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "구독 정보를 찾을 수 없습니다" },
        { status: 404 }
      )
    }

    if (!subscription.pendingPlan) {
      return NextResponse.json(
        { error: "예약된 플랜 변경이 없습니다" },
        { status: 400 }
      )
    }

    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        pendingPlan: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "플랜 변경 예약이 취소되었습니다.",
    })
  } catch (error) {
    console.error("Cancel scheduled upgrade error:", error)
    return NextResponse.json(
      { error: "플랜 변경 예약 취소 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
