import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { userId, cronSecret } = await req.json()

    // CRON 잡으로부터의 요청인지 확인
    if (cronSecret) {
      const validCronSecret = process.env.CRON_SECRET
      if (!validCronSecret || cronSecret !== validCronSecret) {
        return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
      }
    } else {
      // 일반 요청인 경우 관리자 권한 확인
      const session = await auth()
      if (!session?.user) {
        return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
      }

      // 관리자가 아니면 자신의 결제만 가능
      if (userId !== session.user.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        })
        if (user?.role !== 'admin') {
          return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
        }
      }
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { user: true },
    })

    if (!subscription || !subscription.billingKey) {
      return NextResponse.json({ error: "빌링키가 없습니다" }, { status: 400 })
    }

    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: "결제 설정 오류" }, { status: 500 })
    }

    // pendingPlan이 있으면 해당 플랜으로 결제, 없으면 현재 플랜
    const planToCharge = subscription.pendingPlan || subscription.plan

    // 요금 정보 조회
    const pricingPlan = await prisma.pricingPlan.findUnique({
      where: { name: planToCharge },
    })

    if (!pricingPlan) {
      return NextResponse.json({ error: "플랜 정보가 없습니다" }, { status: 400 })
    }

    // 빌링키로 결제 실행
    const paymentResponse = await fetch(
      `https://api.tosspayments.com/v1/billing/${subscription.billingKey}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerKey: subscription.customerKey,
          amount: pricingPlan.price,
          orderId: `SUB_${Date.now()}_${userId.substring(0, 8)}`,
          orderName: `AI-GFC ${planToCharge.toUpperCase()} 플랜 월 구독료`,
          customerEmail: subscription.user.email,
          customerName: subscription.user.name || subscription.user.email,
        }),
      }
    )

    const paymentData = await paymentResponse.json()

    if (!paymentResponse.ok) {
      console.error('Billing charge error:', paymentData)

      // 결제 실패 로그
      await prisma.paymentLog.create({
        data: {
          userId,
          amount: pricingPlan.price,
          currency: 'KRW',
          status: 'failed',
          transactionId: paymentData.code || 'FAILED',
          description: `${planToCharge.toUpperCase()} 플랜 자동결제 실패: ${paymentData.message}`,
        },
      })

      return NextResponse.json(
        { error: "결제 실패", message: paymentData.message },
        { status: 400 }
      )
    }

    // 결제 성공: 구독 기간 갱신 및 로그 생성
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    // pendingPlan이 있었는지 확인 (플랜 업그레이드 여부)
    const wasUpgrade = !!subscription.pendingPlan

    await prisma.$transaction(async (tx) => {
      // 결제 로그 생성
      const description = wasUpgrade
        ? `${subscription.plan.toUpperCase()} → ${planToCharge.toUpperCase()} 플랜 업그레이드 자동결제`
        : `${planToCharge.toUpperCase()} 플랜 자동결제`

      await tx.paymentLog.create({
        data: {
          userId,
          amount: pricingPlan.price,
          currency: 'KRW',
          status: 'completed',
          transactionId: paymentData.orderId,
          paymentMethod: paymentData.method,
          description,
          paidAt: new Date(paymentData.approvedAt),
        },
      })

      // 구독 기간 갱신 및 플랜 변경 적용
      await tx.subscription.update({
        where: { userId },
        data: {
          plan: planToCharge, // pendingPlan이 있었으면 해당 플랜으로 변경
          pendingPlan: null,  // pendingPlan 초기화
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          status: 'active',
        },
      })
    })

    return NextResponse.json({
      success: true,
      orderId: paymentData.orderId,
      amount: paymentData.totalAmount,
    })
  } catch (error) {
    console.error("Billing charge error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
