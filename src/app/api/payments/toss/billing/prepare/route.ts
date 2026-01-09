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

    // TossPayments는 클라이언트 측에서 카드 정보를 입력받아 authKey를 발급하고,
    // 서버에서 그 authKey를 빌링키로 변환하는 방식을 사용합니다.
    // 따라서 여기서는 customerKey와 URL만 반환합니다.
    return NextResponse.json({
      customerKey,
      successUrl: `${baseUrl}/api/payments/toss/billing/success?planName=${planName}&amount=${amount}&customerKey=${customerKey}`,
      failUrl: `${baseUrl}/pricing?error=billing_auth_failed`,
    })
  } catch (error) {
    console.error("Billing prepare error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
