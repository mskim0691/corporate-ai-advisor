import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { planName, amount } = await req.json()

    if (!planName || amount === undefined) {
      return NextResponse.json({ error: "플랜 정보가 필요합니다" }, { status: 400 })
    }

    // 유효한 플랜인지 확인
    const validPlans = ['pro', 'expert']
    if (!validPlans.includes(planName)) {
      return NextResponse.json({ error: "유효하지 않은 플랜입니다" }, { status: 400 })
    }

    // 주문 ID 생성
    const orderId = `SUB_${uuidv4().replace(/-/g, '').substring(0, 20)}`

    // 결제 로그 생성 (pending 상태)
    await prisma.paymentLog.create({
      data: {
        userId: session.user.id,
        amount: amount,
        currency: 'KRW',
        status: 'pending',
        transactionId: orderId,
        description: `${planName.toUpperCase()} 플랜 구독`,
      },
    })

    // 토스페이먼츠 결제창 URL 생성
    const clientKey = process.env.TOSS_CLIENT_KEY
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!clientKey) {
      return NextResponse.json({ error: "결제 설정이 완료되지 않았습니다" }, { status: 500 })
    }

    // 토스페이먼츠 결제 위젯용 데이터 반환
    // customerKey는 고객 식별을 위한 고유 키 (사용자 ID 기반)
    const customerKey = `CK_${session.user.id.replace(/-/g, '').substring(0, 20)}`

    return NextResponse.json({
      orderId,
      amount,
      orderName: `AI-GFC ${planName.toUpperCase()} 플랜 월간 구독`,
      customerName: session.user.name || session.user.email,
      customerEmail: session.user.email,
      successUrl: `${baseUrl}/api/payments/toss/success?planName=${planName}`,
      failUrl: `${baseUrl}/api/payments/toss/fail`,
      clientKey,
      customerKey,
    })
  } catch (error) {
    console.error("Payment ready error:", error)
    return NextResponse.json(
      { error: "결제 준비 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
