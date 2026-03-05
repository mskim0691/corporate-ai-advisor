import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    // Vercel Cron 인증 확인
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    // 결제 대상: billingKey가 있고, currentPeriodEnd가 지난 active 구독
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        billingKey: { not: null },
        status: 'active',
        currentPeriodEnd: { lte: now },
        plan: { in: ['pro', 'expert'] },
      },
      include: { user: true },
    })

    console.log(`[Cron Billing] Found ${expiredSubscriptions.length} subscriptions to renew`)

    const results: { userId: string; success: boolean; error?: string }[] = []

    for (const subscription of expiredSubscriptions) {
      try {
        // billing/charge API를 내부 호출하는 대신 직접 결제 실행
        const planToCharge = subscription.pendingPlan || subscription.plan

        const pricingPlan = await prisma.pricingPlan.findFirst({
          where: { name: { equals: planToCharge, mode: 'insensitive' } },
        })

        if (!pricingPlan) {
          console.error(`[Cron Billing] Plan not found: ${planToCharge} for user ${subscription.userId}`)
          results.push({ userId: subscription.userId, success: false, error: 'Plan not found' })
          continue
        }

        const secretKey = process.env.TOSS_SECRET_KEY
        if (!secretKey) {
          results.push({ userId: subscription.userId, success: false, error: 'Missing TOSS_SECRET_KEY' })
          continue
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
              orderId: `SUB_RENEW_${Date.now()}_${subscription.userId.substring(0, 8)}`,
              orderName: `AI-GFC ${planToCharge.toUpperCase()} 플랜 월 구독 갱신`,
              customerEmail: subscription.user.email,
              customerName: subscription.user.name || subscription.user.email,
            }),
          }
        )

        const paymentData = await paymentResponse.json()

        if (!paymentResponse.ok) {
          console.error(`[Cron Billing] Payment failed for user ${subscription.userId}:`, paymentData.message)

          // 결제 실패 로그
          await prisma.paymentLog.create({
            data: {
              userId: subscription.userId,
              amount: pricingPlan.price,
              currency: 'KRW',
              status: 'failed',
              transactionId: paymentData.code || `FAILED_${Date.now()}`,
              description: `${planToCharge.toUpperCase()} 플랜 자동갱신 실패: ${paymentData.message}`,
            },
          })

          // 연속 실패 시 구독 상태를 past_due로 변경
          await prisma.subscription.update({
            where: { userId: subscription.userId },
            data: { status: 'past_due' },
          })

          results.push({ userId: subscription.userId, success: false, error: paymentData.message })
          continue
        }

        // 결제 성공: 구독 기간 갱신
        const newPeriodStart = new Date(now)
        const newPeriodEnd = new Date(now)
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)

        const wasUpgrade = !!subscription.pendingPlan

        await prisma.$transaction(async (tx) => {
          await tx.paymentLog.create({
            data: {
              userId: subscription.userId,
              amount: pricingPlan.price,
              currency: 'KRW',
              status: 'completed',
              transactionId: paymentData.orderId,
              paymentMethod: paymentData.method,
              description: wasUpgrade
                ? `${subscription.plan.toUpperCase()} → ${planToCharge.toUpperCase()} 플랜 업그레이드 자동갱신`
                : `${planToCharge.toUpperCase()} 플랜 자동갱신`,
              paidAt: new Date(paymentData.approvedAt),
            },
          })

          await tx.subscription.update({
            where: { userId: subscription.userId },
            data: {
              plan: planToCharge,
              pendingPlan: null,
              currentPeriodStart: newPeriodStart,
              currentPeriodEnd: newPeriodEnd,
              status: 'active',
            },
          })
        })

        console.log(`[Cron Billing] Successfully renewed subscription for user ${subscription.userId}`)
        results.push({ userId: subscription.userId, success: true })
      } catch (err) {
        console.error(`[Cron Billing] Error processing user ${subscription.userId}:`, err)
        results.push({ userId: subscription.userId, success: false, error: 'Internal error' })
      }
    }

    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`[Cron Billing] Complete: ${succeeded} succeeded, ${failed} failed out of ${results.length} total`)

    return NextResponse.json({
      processed: results.length,
      succeeded,
      failed,
      results,
    })
  } catch (error) {
    console.error("[Cron Billing] Fatal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
