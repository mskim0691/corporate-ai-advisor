import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { planName, amount } = await req.json()

    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: "결제 설정 오류" }, { status: 500 })
    }

    // customerKey는 사용자 ID 기반으로 생성 (고유하고 안전하게)
    const customerKey = `CK_${session.user.id.replace(/-/g, '').substring(0, 20)}`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 빌링키 발급을 위한 카드 등록 페이지 URL 요청
    const response = await fetch(
      'https://api.tosspayments.com/v1/billing/authorizations/card',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerKey,
          successUrl: `${baseUrl}/api/payments/toss/billing/success?planName=${planName}&amount=${amount}`,
          failUrl: `${baseUrl}/pricing?error=billing_auth_failed`,
          customerEmail: session.user.email,
          customerName: session.user.name || session.user.email,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Billing auth request error:', data)
      return NextResponse.json(
        { error: data.message || '빌링 인증 요청 실패' },
        { status: response.status }
      )
    }

    // TossPayments가 반환한 인증 URL로 리다이렉트
    return NextResponse.json({
      redirectUrl: data.url,
      customerKey,
    })
  } catch (error) {
    console.error("Billing prepare error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
