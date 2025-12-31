import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    const { searchParams } = new URL(req.url)
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')
    const planName = searchParams.get('planName')

    if (!paymentKey || !orderId || !amount || !planName) {
      return NextResponse.redirect(new URL('/pricing?error=missing_params', req.url))
    }

    // 토스페이먼츠 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) {
      return NextResponse.redirect(new URL('/pricing?error=config_error', req.url))
    }

    const confirmResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount),
      }),
    })

    const confirmData = await confirmResponse.json()

    if (!confirmResponse.ok) {
      console.error('Toss payment confirm error:', confirmData)
      return NextResponse.redirect(new URL(`/pricing?error=payment_failed&message=${encodeURIComponent(confirmData.message || '결제 실패')}`, req.url))
    }

    // 결제 성공 - DB 업데이트
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    // 트랜잭션으로 결제 로그 업데이트 및 구독 정보 업데이트
    await prisma.$transaction(async (tx) => {
      // 결제 로그 업데이트
      await tx.paymentLog.updateMany({
        where: { transactionId: orderId },
        data: {
          status: 'completed',
          paymentMethod: confirmData.method,
          paidAt: new Date(confirmData.approvedAt),
        },
      })

      // 구독 정보 업데이트 또는 생성
      const existingSubscription = await tx.subscription.findUnique({
        where: { userId: session.user.id },
      })

      if (existingSubscription) {
        await tx.subscription.update({
          where: { userId: session.user.id },
          data: {
            plan: planName,
            status: 'active',
            stripeSubscriptionId: paymentKey, // 토스페이먼츠 결제키 저장
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        })
      } else {
        await tx.subscription.create({
          data: {
            userId: session.user.id,
            plan: planName,
            status: 'active',
            stripeSubscriptionId: paymentKey,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        })
      }
    })

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/pricing/success', req.url))
  } catch (error) {
    console.error("Payment success callback error:", error)
    return NextResponse.redirect(new URL('/pricing?error=server_error', req.url))
  }
}
