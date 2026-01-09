import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { planName, amount } = await req.json()

    // customerKey는 사용자 ID 기반으로 생성 (고유하고 안전하게)
    const customerKey = `CK_${session.user.id.replace(/-/g, '').substring(0, 20)}`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 빌링키 발급 요청을 위한 authKey 생성 (서버에서 처리)
    const authUrl = `https://api.tosspayments.com/v1/billing/authorizations/card?`
    const params = new URLSearchParams({
      customerKey,
      successUrl: `${baseUrl}/api/payments/toss/billing/success?planName=${planName}&amount=${amount}`,
      failUrl: `${baseUrl}/pricing?error=billing_auth_failed`,
    })

    return NextResponse.json({
      redirectUrl: authUrl + params.toString(),
      customerKey,
      customerEmail: session.user.email,
      customerName: session.user.name || session.user.email,
    })
  } catch (error) {
    console.error("Billing prepare error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
