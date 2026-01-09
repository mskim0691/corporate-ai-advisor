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
    const authKey = searchParams.get('authKey')
    const customerKey = searchParams.get('customerKey')
    const planName = searchParams.get('planName')
    const amount = searchParams.get('amount')

    if (!authKey || !customerKey || !planName || !amount) {
      return NextResponse.redirect(
        new URL('/pricing?error=missing_params', req.url)
      )
    }

    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) {
      return NextResponse.redirect(new URL('/pricing?error=config_error', req.url))
    }

    // 빌링키 발급 API 호출
    const issueResponse = await fetch(
      'https://api.tosspayments.com/v1/billing/authorizations/issue',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authKey,
          customerKey,
        }),
      }
    )

    const issueData = await issueResponse.json()

    if (!issueResponse.ok) {
      console.error('Billing key issue error:', issueData)
      return NextResponse.redirect(
        new URL(
          `/pricing?error=billing_issue_failed&message=${encodeURIComponent(
            issueData.message || '빌링키 발급 실패'
          )}`,
          req.url
        )
      )
    }

    const billingKey = issueData.billingKey

    // 빌링키로 첫 결제 실행
    const paymentResponse = await fetch(
      `https://api.tosspayments.com/v1/billing/${billingKey}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerKey,
          amount: parseInt(amount),
          orderId: `SUB_INIT_${Date.now()}_${session.user.id.substring(0, 8)}`,
          orderName: `AI-GFC ${planName.toUpperCase()} 플랜 첫 결제`,
          customerEmail: session.user.email,
          customerName: session.user.name || session.user.email,
        }),
      }
    )

    const paymentData = await paymentResponse.json()

    if (!paymentResponse.ok) {
      console.error('First billing payment error:', paymentData)
      return NextResponse.redirect(
        new URL(
          `/pricing?error=payment_failed&message=${encodeURIComponent(
            paymentData.message || '첫 결제 실패'
          )}`,
          req.url
        )
      )
    }

    // DB 업데이트: 구독 정보 및 빌링키 저장
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    await prisma.$transaction(async (tx) => {
      // 결제 로그 생성
      await tx.paymentLog.create({
        data: {
          userId: session.user.id,
          amount: parseInt(amount),
          currency: 'KRW',
          status: 'completed',
          transactionId: paymentData.orderId,
          paymentMethod: paymentData.method,
          description: `${planName.toUpperCase()} 플랜 첫 결제 (빌링키 등록)`,
          paidAt: new Date(paymentData.approvedAt),
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
            billingKey,
            customerKey,
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
            billingKey,
            customerKey,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        })
      }
    })

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/pricing/success', req.url))
  } catch (error) {
    console.error('Billing success callback error:', error)
    return NextResponse.redirect(new URL('/pricing?error=server_error', req.url))
  }
}
