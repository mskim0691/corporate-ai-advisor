import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { code } = await req.json()

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "쿠폰 코드를 입력해주세요" },
        { status: 400 }
      )
    }

    // Normalize code (uppercase, trim spaces)
    const normalizedCode = code.toUpperCase().trim()

    // Find the coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    })

    if (!coupon) {
      return NextResponse.json(
        { error: "유효하지 않은 쿠폰 코드입니다" },
        { status: 404 }
      )
    }

    // Check if already redeemed
    if (coupon.redeemedBy) {
      return NextResponse.json(
        { error: "이미 사용된 쿠폰입니다. 담당자에게 문의하세요." },
        { status: 400 }
      )
    }

    // Calculate expiration date
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + coupon.durationDays)

    // Transaction: Update coupon and subscription
    await prisma.$transaction(async (tx) => {
      // Mark coupon as redeemed
      await tx.coupon.update({
        where: { id: coupon.id },
        data: {
          redeemedBy: session.user.id,
          redeemedAt: now,
          expiresAt: expiresAt,
        },
      })

      // Update or create subscription
      const existingSubscription = await tx.subscription.findUnique({
        where: { userId: session.user.id },
      })

      if (existingSubscription) {
        await tx.subscription.update({
          where: { userId: session.user.id },
          data: {
            plan: coupon.plan,
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
            // Don't overwrite billingKey if user has paid subscription
            // They'll just get the coupon benefit for the period
          },
        })
      } else {
        await tx.subscription.create({
          data: {
            userId: session.user.id,
            plan: coupon.plan,
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
          },
        })
      }

      // Log the redemption
      await tx.paymentLog.create({
        data: {
          userId: session.user.id,
          amount: 0,
          currency: "KRW",
          status: "completed",
          description: `쿠폰 등록: ${coupon.plan.toUpperCase()} 플랜 ${coupon.durationDays}일 이용권 (${coupon.code})`,
          paidAt: now,
        },
      })
    })

    const formattedExpiresAt = expiresAt.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    return NextResponse.json({
      success: true,
      message: `Pro 플랜이 적용되었습니다. 유효기간은 ${formattedExpiresAt}까지입니다.`,
      plan: coupon.plan,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("Coupon redemption error:", error)
    return NextResponse.json(
      { error: "쿠폰 등록 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
